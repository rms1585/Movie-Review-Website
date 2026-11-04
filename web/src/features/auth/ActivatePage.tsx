import { CircleCheck, Link2Off } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppLink, useNavigation } from "../../app/router/navigation";
import { showToast } from "../../shared/ui/Toast";
import { AccountHead, AccountLayout, AccountMessage } from "./AccountLayout";
import { activateAccount, isLinkProblem } from "./accountApi";
import { SetPasswordForm } from "./SetPasswordForm";
import type { SetPasswordOutcome } from "./SetPasswordForm";
import { takeAfterActivation, withReturnTo } from "./returnTo";

type ActivateState = "form" | "expired" | "ready" | "already-active";

/**
 * /activate?code=… — the page the sign-up email links to (SPEC §7.9, Flow 4).
 * The link carries only a code, so the email is asked for alongside the
 * password: with both, the person is signed in straight after and taken
 * back to whatever they were doing before signing up.
 */
export function ActivatePage({ code }: { code: string | null }) {
  const { signIn } = useAuth();
  const { navigate } = useNavigation();
  const [state, setState] = useState<ActivateState>(code ? "form" : "expired");
  // Read once, at the moment the account becomes usable, then forgotten.
  const [returnTo, setReturnTo] = useState("/");

  async function submit({ email, password }: { email: string; password: string }): Promise<SetPasswordOutcome> {
    const result = await activateAccount(code ?? "", password);
    if (!result.ok) {
      const messages = Object.values(result.errors).join(" ");
      if (/already/i.test(messages)) {
        setReturnTo(takeAfterActivation());
        setState("already-active");
        return { kind: "done" };
      }
      if (isLinkProblem(result.errors)) return { kind: "link-problem" };
      return messages ? { kind: "password-problem", message: messages } : { kind: "error" };
    }

    const back = takeAfterActivation();
    const login = await signIn({ email, password, rememberMe: true }).catch(() => undefined);
    if (login?.ok) {
      showToast("Welcome to Limereel");
      navigate(back);
    } else {
      // Activated, but the sign-in didn't take (for example, a typo in the
      // email). The account is fine; they just log in themselves.
      setReturnTo(back);
      setState("ready");
    }
    return { kind: "done" };
  }

  if (state === "ready" || state === "already-active") {
    return (
      <AccountLayout>
        <AccountMessage
          actions={<AppLink className="button button--primary" to={withReturnTo("/login", returnTo)}>Log in</AppLink>}
          icon={<CircleCheck aria-hidden="true" className="account__sent-icon" />}
          title={state === "ready" ? "Your account is ready" : "You're all set"}
        >
          <p>{state === "ready" ? "Log in with your email and the password you just set." : "This account is already active. Log in to carry on."}</p>
        </AccountMessage>
      </AccountLayout>
    );
  }

  if (state === "expired") {
    return (
      <AccountLayout>
        <AccountMessage
          actions={<AppLink className="button button--primary" to="/signup">Resend activation email</AppLink>}
          icon={<Link2Off aria-hidden="true" className="account__sent-icon" />}
          title="This link has expired"
        >
          <p>Enter the same email on the sign-up page and we'll send a fresh link.</p>
        </AccountMessage>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <AccountHead lede="Set a password to finish creating your Limereel account." title="Activate your account" />
      <SetPasswordForm askEmail busyLabel="Activating…" onLinkProblem={() => setState("expired")} onSubmit={submit} submitLabel="Activate account" />
    </AccountLayout>
  );
}
