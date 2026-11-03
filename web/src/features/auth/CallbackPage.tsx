import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useNavigation } from "../../app/router/navigation";
import { completeLogin } from "../../lib/blocks/auth";
import { StatusLine } from "../../shared/ui/StatusLine";

/** Delay before "Signing you in…" appears, so fast sign-ins never flash it (animation.md §4.12). */
const STATUS_DELAY_MS = 300;

export function CallbackPage() {
  const { refresh } = useAuth();
  const { navigate } = useNavigation();
  const [error, setError] = useState<string | undefined>();
  const [showStatus, setShowStatus] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowStatus(true), STATUS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    completeLogin(window.location.href)
      .then(async (result) => {
        if (!result.ok) {
          setError(result.message);
          return;
        }
        await refresh();
        navigate(result.returnTo);
      })
      // completeLogin converts the failures it knows about into a result;
      // this backstop keeps an unexpected throw from hanging the spinner.
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Sign-in didn't complete.");
      });
  }, [navigate, refresh]);

  return (
    <main className="app-main container">
      {error ? (
        <div className="notice" role="alert">
          <h1>Sign-in didn't finish</h1>
          <p>{error}</p>
          <div>
            <a className="button button--secondary" href="/">Back to home</a>
          </div>
        </div>
      ) : (
        showStatus && <StatusLine label="Signing you in…" />
      )}
    </main>
  );
}
