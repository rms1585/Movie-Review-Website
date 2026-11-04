import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppLink } from "../../app/router/navigation";
import { EmptyState } from "../../shared/ui/EmptyState";
import { AccountHead, AccountLayout, AccountMessage } from "./AccountLayout";
import { NETWORK_ERROR, checkEmail, readField } from "./formChecks";
import { rememberAfterActivation, safeReturnTo, withReturnTo } from "./returnTo";
import { signUp } from "./signupApi";

/**
 * Limereel's sign-up form (/signup). IAM creates the account and emails a
 * link to /activate, where the password is set, so this form never handles
 * a password. Where the person was is saved first, so activation can bring
 * them back to it (SPEC Flow 4).
 */
export function SignUpPage({ returnTo }: { returnTo: string | null }) {
  const { status } = useAuth();
  const [sentTo, setSentTo] = useState<string | undefined>();
  const target = safeReturnTo(returnTo);

  if (status === "authenticated") {
    return (
      <AccountLayout>
        <EmptyState
          action={<AppLink className="button button--primary" to="/me">Go to your profile</AppLink>}
          text="You already have an account and you're signed in."
          title="You're signed in"
        />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      {sentTo ? (
        <CheckYourEmail email={sentTo} onUseDifferentEmail={() => setSentTo(undefined)} />
      ) : (
        <SignUpForm
          onSent={(email) => {
            rememberAfterActivation(target);
            setSentTo(email);
          }}
          returnTo={target}
        />
      )}
    </AccountLayout>
  );
}

function SignUpForm({ onSent, returnTo }: { onSent: (email: string) => void; returnTo: string }) {
  const ids = { firstName: useId(), lastName: useId(), email: useId(), emailError: useId() };
  const emailRef = useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const submit = useMutation({ mutationFn: signUp });
  const isSubmitting = submit.isPending;

  function showEmailError(message: string) {
    setEmailError(message);
    emailRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const request = { email: readField(form, "email"), firstName: readField(form, "firstName"), lastName: readField(form, "lastName") };

    setFormError(undefined);
    const problem = checkEmail(request.email);
    if (problem) {
      showEmailError(problem);
      return;
    }
    setEmailError(undefined);

    try {
      const result = await submit.mutateAsync(request);
      if (result.ok) {
        onSent(request.email);
        return;
      }
      const { Email: emailMessage, ...others } = result.fieldErrors;
      if (emailMessage) showEmailError(emailMessage);
      const otherMessages = Object.values(others);
      if (otherMessages.length > 0 || !emailMessage) {
        setFormError(otherMessages.join(" ") || "We couldn't create your account. Try again shortly.");
      }
    } catch {
      setFormError(NETWORK_ERROR);
    }
  }

  return (
    <>
      <AccountHead lede="Rate films and keep a history of everything you've scored." title="Create your account" />

      <form className="account__form" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="account__fieldset" disabled={isSubmitting}>
          <div className="account__names">
            <div className="field">
              <label className="field__label" htmlFor={ids.firstName}>
                First name <span className="field__optional">(optional)</span>
              </label>
              <input autoComplete="given-name" className="field__input" id={ids.firstName} name="firstName" type="text" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor={ids.lastName}>
                Last name <span className="field__optional">(optional)</span>
              </label>
              <input autoComplete="family-name" className="field__input" id={ids.lastName} name="lastName" type="text" />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={ids.email}>Email</label>
            <input
              aria-describedby={emailError ? ids.emailError : undefined}
              aria-invalid={emailError ? true : undefined}
              autoComplete="email"
              className="field__input"
              id={ids.email}
              inputMode="email"
              name="email"
              onInput={() => emailError && setEmailError(undefined)}
              ref={emailRef}
              type="email"
            />
            {emailError && <p className="field__error" id={ids.emailError}>{emailError}</p>}
          </div>
        </fieldset>

        {formError && <p className="account__form-error" role="alert">{formError}</p>}

        <button aria-disabled={isSubmitting} className="button button--primary account__submit" type="submit">
          {isSubmitting ? "Creating your account…" : "Create account"}
        </button>

        <p className="account__hint">We'll email you a link to set your password.</p>
      </form>

      <p className="account__switch">
        Already have an account? <AppLink className="account__link" to={withReturnTo("/login", returnTo)}>Log in</AppLink>
      </p>
    </>
  );
}

function CheckYourEmail({ email, onUseDifferentEmail }: { email: string; onUseDifferentEmail: () => void }) {
  return (
    <AccountMessage
      actions={
        <>
          <AppLink className="button button--secondary" to="/">Back to films</AppLink>
          <button className="text-button" onClick={onUseDifferentEmail} type="button">Use a different email</button>
        </>
      }
      icon={<MailCheck aria-hidden="true" className="account__sent-icon" />}
      title="Check your email"
    >
      <p>
        We sent a link to <strong>{email}</strong>. It opens on Limereel, where you set your password and finish creating your account.
      </p>
      <p className="account__hint">It can take a minute to arrive. If it doesn't, check your spam folder.</p>
    </AccountMessage>
  );
}
