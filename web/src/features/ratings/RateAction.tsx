import { Star } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppLink } from "../../app/router/navigation";
import { Dialog } from "../../shared/ui/Dialog";

/**
 * The film page's one primary action. Signed out, it asks to sign in where
 * the visitor is (SPEC §7.8) and comes back to this film's rating screen, so
 * nobody has to find the film again (Flow 4).
 */
export function RateAction({ tmdbMovieId, filmTitle, hasRated }: { tmdbMovieId: number; filmTitle: string; hasRated: boolean }) {
  const { status, login } = useAuth();
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const ratePath = `/movie/${tmdbMovieId}/review`;
  const label = hasRated ? "Change your rating" : "Rate";

  if (status === "authenticated") {
    return (
      <AppLink className="button button--primary" to={ratePath}>
        <Star aria-hidden="true" className="icon" />
        {label}
      </AppLink>
    );
  }

  async function handleSignIn() {
    setIsRedirecting(true);
    try {
      await login(ratePath);
    } catch {
      // The browser only stays when the redirect could not start.
      setIsRedirecting(false);
    }
  }

  return (
    <>
      <button
        aria-disabled={status === "loading"}
        className="button button--primary"
        onClick={status === "loading" ? undefined : () => setIsPromptOpen(true)}
        type="button"
      >
        <Star aria-hidden="true" className="icon" />
        Rate
      </button>
      <Dialog onClose={() => setIsPromptOpen(false)} open={isPromptOpen} title="Sign in to rate this film">
        <p className="dialog__text">
          You'll come straight back to rate {filmTitle}. Browsing and reading never need an account.
        </p>
        <div className="dialog__actions">
          {/* autoFocus is honoured by the native <dialog> when it opens, so focus
              lands on the action people came for rather than the close button. */}
          <button aria-disabled={isRedirecting} autoFocus className="button button--primary" onClick={isRedirecting ? undefined : () => void handleSignIn()} type="button">
            {isRedirecting ? "Opening sign-in…" : "Log in or sign up"}
          </button>
          <button className="button button--secondary" onClick={() => setIsPromptOpen(false)} type="button">
            Not now
          </button>
        </div>
      </Dialog>
    </>
  );
}
