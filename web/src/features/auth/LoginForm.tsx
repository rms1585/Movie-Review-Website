import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppLink } from "../../app/router/navigation";
import type { LoginFailure } from "../../lib/blocks/auth";
import { requestActivationEmail } from "./accountApi";
import { NETWORK_ERROR, checkEmail, readField, takePassword } from "./formChecks";
import { PasswordField } from "./PasswordField";
import { withReturnTo } from "./returnTo";

type FormProblem = LoginFailure | "network";

type LoginFormProps = {
  /** Where the sign-up and reset links bring the person back to. */
  returnTo: string;
  onSuccess: () => void;
  /** In a dialog, mark the email field as the one to focus on open (see Dialog). */
  autoFocus?: boolean;
};

/**
 * Email and password sign-in, shared by /login and the "Sign in to rate"
 * dialog (SPEC §7.8, §7.9). Wrong email and wrong password get one message,
 * so the form never reveals whether an account exists.
 */
export function LoginForm({ returnTo, onSuccess, autoFocus = false }: LoginFormProps) {
  const { signIn } = useAuth();
  const emailId = useId();
  const emailErrorId = useId();
  const rememberId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [problem, setProblem] = useState<{ kind: FormProblem; message?: string; email: string } | undefined>();

  // Focus follows a new message once it's on screen and the form is unlocked.
  useEffect(() => {
    if (problem && !isSubmitting) problemRef.current?.focus();
  }, [problem, isSubmitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const email = readField(form, "email");
    const rememberMe = (form.elements.namedItem("rememberMe") as HTMLInputElement | null)?.checked ?? true;
    setProblem(undefined);

    const emailProblem = checkEmail(email);
    if (emailProblem) {
      setEmailError(emailProblem);
      emailRef.current?.focus();
      return;
    }
    setEmailError(undefined);

    const password = takePassword(form, "password");
    if (!password) {
      setPasswordError("Enter your password.");
      passwordRef.current?.focus();
      return;
    }
    setPasswordError(undefined);

    setIsSubmitting(true);
    try {
      const result = await signIn({ email, password, rememberMe });
      if (result.ok) {
        onSuccess();
        return;
      }
      setProblem({ kind: result.reason, email, message: result.message });
    } catch {
      setProblem({ kind: "network", email });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="account__form" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <fieldset className="account__fieldset" disabled={isSubmitting}>
        <div className="field">
          <label className="field__label" htmlFor={emailId}>Email</label>
          <input
            aria-describedby={emailError ? emailErrorId : undefined}
            aria-invalid={emailError ? true : undefined}
            autoComplete="email"
            data-autofocus={autoFocus ? "" : undefined}
            className="field__input"
            id={emailId}
            inputMode="email"
            name="email"
            onInput={() => emailError && setEmailError(undefined)}
            ref={emailRef}
            type="email"
          />
          {emailError && <p className="field__error" id={emailErrorId}>{emailError}</p>}
        </div>

        <PasswordField
          autoComplete="current-password"
          error={passwordError}
          inputRef={passwordRef}
          label="Password"
          name="password"
          onInput={() => passwordError && setPasswordError(undefined)}
        />

        <div className="account__row">
          <label className="checkbox" htmlFor={rememberId}>
            <input className="checkbox__input" defaultChecked id={rememberId} name="rememberMe" type="checkbox" />
            Keep me signed in
          </label>
          <AppLink className="account__link" to={withReturnTo("/forgot-password", returnTo)}>Forgot password?</AppLink>
        </div>
      </fieldset>

      {problem && (
        <div className="account__form-error" ref={problemRef} role="alert" tabIndex={-1}>
          <ProblemMessage email={problem.email} kind={problem.kind} message={problem.message} returnTo={returnTo} />
        </div>
      )}

      <button aria-disabled={isSubmitting} className="button button--primary account__submit" type="submit">
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>

      <p className="account__alt">
        New here? <AppLink className="account__link" to={withReturnTo("/signup", returnTo)}>Create an account</AppLink>
      </p>
    </form>
  );
}

function ProblemMessage({ kind, message, email, returnTo }: { kind: FormProblem; message?: string; email: string; returnTo: string }): ReactNode {
  switch (kind) {
    case "invalid":
      return "That email and password don't match.";
    case "not_activated":
      return <ResendActivation email={email} />;
    case "locked":
      return (
        <>
          {message || "This account is locked after too many tries. Try again later."}{" "}
          <AppLink className="account__link" to={withReturnTo("/forgot-password", returnTo)}>Reset password</AppLink>
        </>
      );
    case "mfa_required":
      return "This account uses a second sign-in step, which Limereel doesn't support yet.";
    case "network":
      return NETWORK_ERROR;
    case "other":
      return message || "Sign-in didn't work. Try again.";
  }
}

function ResendActivation({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function resend() {
    setState("sending");
    try {
      await requestActivationEmail(email);
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  if (state === "sent") return "If that account still needs activating, we've sent a new link. Check your inbox.";

  return (
    <>
      {state === "failed" ? `${NETWORK_ERROR} ` : "Check your inbox to activate your account. "}
      <button aria-disabled={state === "sending"} className="text-button" onClick={state === "sending" ? undefined : () => void resend()} type="button">
        {state === "sending" ? "Sending…" : "Resend email"}
      </button>
    </>
  );
}
