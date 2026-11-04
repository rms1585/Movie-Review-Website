import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { NETWORK_ERROR, checkEmail, checkNewPassword, readField, takePassword } from "./formChecks";
import { PasswordField } from "./PasswordField";

/** What the page did with the submitted values. */
export type SetPasswordOutcome =
  | { kind: "done" }
  | { kind: "link-problem" }
  | { kind: "password-problem"; message: string }
  | { kind: "error"; message?: string };

type SetPasswordFormProps = {
  submitLabel: string;
  busyLabel: string;
  /** Activation also asks for the email, so the person can be signed in straight after. */
  askEmail?: boolean;
  onSubmit: (values: { email: string; password: string }) => Promise<SetPasswordOutcome>;
  onLinkProblem: () => void;
};

// Blocks owns the password rules and doesn't publish them to a signed-out
// page, so this states what IAM will do rather than inventing rules it might
// not enforce.
const PASSWORD_HINT = "Blocks checks the strength. If it needs to be stronger, we'll say why here.";

/** New password + confirm, shared by /reset-password and /activate (SPEC §7.9). */
export function SetPasswordForm({ submitLabel, busyLabel, askEmail = false, onSubmit, onLinkProblem }: SetPasswordFormProps) {
  const emailId = useId();
  const emailErrorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; form?: string }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const email = askEmail ? readField(form, "email") : "";
    const emailProblem = askEmail ? checkEmail(email) : undefined;
    if (emailProblem) {
      setErrors({ email: emailProblem });
      emailRef.current?.focus();
      return;
    }

    const password = takePassword(form, "password");
    const confirm = takePassword(form, "confirmPassword");
    const passwordProblems = checkNewPassword(password, confirm);
    if (passwordProblems.password || passwordProblems.confirm) {
      setErrors(passwordProblems);
      (passwordProblems.password ? passwordRef : confirmRef).current?.focus();
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const outcome = await onSubmit({ email, password });
      if (outcome.kind === "link-problem") onLinkProblem();
      if (outcome.kind === "password-problem") {
        setErrors({ password: outcome.message });
        passwordRef.current?.focus();
      }
      if (outcome.kind === "error") setErrors({ form: outcome.message || NETWORK_ERROR });
    } catch {
      setErrors({ form: NETWORK_ERROR });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="account__form" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <fieldset className="account__fieldset" disabled={isSubmitting}>
        {askEmail && (
          <div className="field">
            <label className="field__label" htmlFor={emailId}>Email</label>
            <input
              aria-describedby={errors.email ? emailErrorId : undefined}
              aria-invalid={errors.email ? true : undefined}
              autoComplete="email"
              className="field__input"
              id={emailId}
              inputMode="email"
              name="email"
              ref={emailRef}
              type="email"
            />
            {errors.email && <p className="field__error" id={emailErrorId}>{errors.email}</p>}
          </div>
        )}
        <PasswordField autoComplete="new-password" error={errors.password} hint={PASSWORD_HINT} inputRef={passwordRef} label="New password" name="password" />
        <PasswordField autoComplete="new-password" error={errors.confirm} inputRef={confirmRef} label="Confirm password" name="confirmPassword" />
      </fieldset>

      {errors.form && <p className="account__form-error" role="alert">{errors.form}</p>}

      <button aria-disabled={isSubmitting} className="button button--primary account__submit" type="submit">
        {isSubmitting ? busyLabel : submitLabel}
      </button>
    </form>
  );
}
