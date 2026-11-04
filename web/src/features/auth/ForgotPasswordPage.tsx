import { MailCheck } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AppLink } from "../../app/router/navigation";
import { AccountHead, AccountLayout, AccountMessage } from "./AccountLayout";
import { requestPasswordReset } from "./accountApi";
import { NETWORK_ERROR, checkEmail, readField } from "./formChecks";
import { safeReturnTo, withReturnTo } from "./returnTo";

/**
 * /forgot-password. Whatever IAM answers, the person sees the same screen,
 * so nobody can use it to find out which emails have accounts (SPEC §7.9).
 */
export function ForgotPasswordPage({ returnTo }: { returnTo: string | null }) {
  const target = safeReturnTo(returnTo);
  const emailId = useId();
  const emailErrorId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const email = readField(event.currentTarget, "email");
    setFormError(undefined);
    const problem = checkEmail(email);
    if (problem) {
      setEmailError(problem);
      emailRef.current?.focus();
      return;
    }
    setEmailError(undefined);

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setIsSent(true);
    } catch (caught) {
      // An answer from IAM (any status) means the request arrived; only a
      // failure to reach it at all is worth telling the person about.
      if ((caught as { status?: number } | null)?.status) setIsSent(true);
      else setFormError(NETWORK_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <AccountLayout>
        <AccountMessage
          actions={<AppLink className="button button--secondary" to={withReturnTo("/login", target)}>Back to log in</AppLink>}
          icon={<MailCheck aria-hidden="true" className="account__sent-icon" />}
          title="Check your email"
        >
          <p>If that email has an account, we've sent a reset link. It opens on Limereel.</p>
          <p className="account__hint">It can take a minute to arrive. If it doesn't, check your spam folder.</p>
        </AccountMessage>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <AccountHead lede="Enter the email you signed up with and we'll send you a link to set a new password." title="Reset your password" />
      <form className="account__form" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="account__fieldset" disabled={isSubmitting}>
          <div className="field">
            <label className="field__label" htmlFor={emailId}>Email</label>
            <input
              aria-describedby={emailError ? emailErrorId : undefined}
              aria-invalid={emailError ? true : undefined}
              autoComplete="email"
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
        </fieldset>

        {formError && <p className="account__form-error" role="alert">{formError}</p>}

        <button aria-disabled={isSubmitting} className="button button--primary account__submit" type="submit">
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>

        <p className="account__alt">
          Remembered it? <AppLink className="account__link" to={withReturnTo("/login", target)}>Log in</AppLink>
        </p>
      </form>
    </AccountLayout>
  );
}
