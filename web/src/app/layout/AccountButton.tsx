import { useId, useState } from "react";
import { isLoginConfigured } from "../../lib/blocks/config";
import { useAuth } from "../providers/AuthProvider";
import { AppLink, useNavigation } from "../router/navigation";
import { UserMenu } from "./UserMenu";

export function AccountButton() {
  const { status, login } = useAuth();
  const { path, search } = useNavigation();
  const [isStarting, setIsStarting] = useState(false);
  const hintId = useId();

  if (status === "authenticated") return <UserMenu />;

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
    <div className="account-buttons">
      {/* Hidden on the sign-up page itself, where it would only link back to where you are. */}
      {path !== "/signup" && (
        <AppLink className="button button--secondary button--sm" to="/signup">Sign up</AppLink>
      )}
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
    </div>
  );
}
