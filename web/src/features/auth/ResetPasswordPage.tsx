import { KeyRound, Link2Off } from "lucide-react";
import { useState } from "react";
import { AppLink } from "../../app/router/navigation";
import { AccountHead, AccountLayout, AccountMessage } from "./AccountLayout";
import { isLinkProblem, resetPassword } from "./accountApi";
import { SetPasswordForm } from "./SetPasswordForm";
import type { SetPasswordOutcome } from "./SetPasswordForm";

/** /reset-password?code=… — the page the reset email links to (SPEC §7.9). */
export function ResetPasswordPage({ code }: { code: string | null }) {
  const [state, setState] = useState<"form" | "done" | "expired">(code ? "form" : "expired");

  async function submit({ password }: { password: string }): Promise<SetPasswordOutcome> {
    const result = await resetPassword(code ?? "", password);
    if (result.ok) {
      setState("done");
      return { kind: "done" };
    }
    if (isLinkProblem(result.errors)) return { kind: "link-problem" };
    const message = Object.values(result.errors).join(" ");
    return message ? { kind: "password-problem", message } : { kind: "error" };
  }

  if (state === "done") {
    return (
      <AccountLayout>
        <AccountMessage
          actions={<AppLink className="button button--primary" to="/login">Log in</AppLink>}
          icon={<KeyRound aria-hidden="true" className="account__sent-icon" />}
          title="Password updated"
        >
          <p>Log in with your new password.</p>
        </AccountMessage>
      </AccountLayout>
    );
  }

  if (state === "expired") {
    return (
      <AccountLayout>
        <AccountMessage
          actions={<AppLink className="button button--primary" to="/forgot-password">Send a new link</AppLink>}
          icon={<Link2Off aria-hidden="true" className="account__sent-icon" />}
          title="This link has expired"
        >
          <p>Reset links work once and only for a while. Ask for a new one and use the latest email.</p>
        </AccountMessage>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <AccountHead title="Set a new password" />
      <SetPasswordForm busyLabel="Saving…" onLinkProblem={() => setState("expired")} onSubmit={submit} submitLabel="Save password" />
    </AccountLayout>
  );
}
