import { useId, useState } from "react";
import { isLoginConfigured } from "../../lib/blocks/config";
import { useAuth } from "../providers/AuthProvider";
import { AppLink, useNavigation } from "../router/navigation";

export function AccountButton() {
  const { status, login } = useAuth();
  const { path, search } = useNavigation();
  const [isStarting, setIsStarting] = useState(false);
  const hintId = useId();

  if (status === "authenticated") {
    return (
      <AppLink className="button button--secondary button--sm" to="/me">
        Your profile
      </AppLink>
    );
  }

  const loginReady = isLoginConfigured();
  const isBusy = status === "loading" || isStarting;

  async function handleLogin() {
    setIsStarting(true);
    try {
      await login(`${path}${search}`);
    } catch {
      // The browser stays here only when the redirect could not start.
      setIsStarting(false);
    }
  }

  return (
    <>
      <button
        aria-describedby={loginReady ? undefined : hintId}
        aria-disabled={!loginReady || isBusy}
        className="button button--primary button--sm"
        onClick={loginReady && !isBusy ? handleLogin : undefined}
        type="button"
      >
        Log in
      </button>
      {!loginReady && <span className="sr-only" id={hintId}>Sign-in is not set up yet.</span>}
    </>
  );
}
