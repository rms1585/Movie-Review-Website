import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppLink } from "../../app/router/navigation";
import { EmptyState } from "../../shared/ui/EmptyState";
import { signUp } from "./signupApi";

// A light format check so obvious typos fail before the round trip;
// IAM still makes the final call on what counts as a valid address.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NETWORK_ERROR = "We couldn't reach the sign-up service. Check your connection and try again.";

function checkEmail(email: string): string | undefined {
  if (!email) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "Enter an email address like name@example.com.";
  return undefined;
}

/**
 * Limereel's own sign-up form (/signup). Blocks' hosted page can't be opened
 * straight onto "Create an account", so this registers through IAM directly;
 * the confirmation email then sets the password, keeping passwords off this site.
 */
export function SignUpPage() {
  const { status } = useAuth();
  const [sentTo, setSentTo] = useState<string | undefined>();

  if (status === "authenticated") {
    return (
      <EmptyState
        action={<AppLink className="button button--primary" to="/me">Go to your profile</AppLink>}
        text="You already have an account and you're signed in."
        title="You're signed in"
      />
    );
  }

  return (
    <div className="signup">
      {sentTo ? <CheckYourEmail email={sentTo} onUseDifferentEmail={() => setSentTo(undefined)} /> : <SignUpForm onSent={setSentTo} />}
    </div>
  );
}

function SignUpForm({ onSent }: { onSent: (email: string) => void }) {
  const { login } = useAuth();
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

    const data = new FormData(event.currentTarget);
    const read = (name: string) => String(data.get(name) ?? "").trim();
    const request = { email: read("email"), firstName: read("firstName"), lastName: read("lastName") };

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
      <div className="page-head">
        <h1>Create your account</h1>
        <p className="page-head__lede">Rate films and keep a history of everything you've scored.</p>
      </div>

      <form className="signup__form" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <div className="signup__names">
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
            onChange={() => emailError && setEmailError(undefined)}
            ref={emailRef}
            required
            type="email"
          />
          {emailError && <p className="field__error" id={ids.emailError}>{emailError}</p>}
        </div>

        {formError && <p className="signup__form-error" role="alert">{formError}</p>}

        <button aria-disabled={isSubmitting} className="button button--primary signup__submit" type="submit">
          {isSubmitting ? "Creating your account…" : "Create account"}
        </button>

        <p className="signup__hint">We'll email you a link to set your password.</p>
      </form>

      <p className="signup__switch">
        Already have an account?{" "}
        <button className="text-button" onClick={() => void login("/")} type="button">Log in</button>
      </p>
    </>
  );
}

function CheckYourEmail({ email, onUseDifferentEmail }: { email: string; onUseDifferentEmail: () => void }) {
  return (
    <section aria-live="polite" className="signup__sent">
      <MailCheck aria-hidden="true" className="signup__sent-icon" />
      <h1>Check your email</h1>
      <p className="signup__sent-text">
        We sent a link to <strong>{email}</strong>. Open it to set your password and finish creating your account.
      </p>
      <p className="signup__hint">It can take a minute to arrive. If it doesn't, check your spam folder.</p>
      <div className="signup__sent-actions">
        <AppLink className="button button--secondary" to="/">Back to films</AppLink>
        <button className="text-button" onClick={onUseDifferentEmail} type="button">Use a different email</button>
      </div>
    </section>
  );
}
