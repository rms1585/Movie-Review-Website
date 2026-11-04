import { Star } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { AppLink, useNavigation } from "../../app/router/navigation";
import { Dialog } from "../../shared/ui/Dialog";
import { LoginForm } from "../auth/LoginForm";

/**
 * The film page's one primary action. Signed out, it opens a sign-in dialog
 * right here (SPEC §7.8): logging in closes it and carries on to this film's
 * rating screen, so nobody leaves the page or has to find the film again
 * (Flow 4). "Create an account" saves the same destination for after
 * activation.
 */
export function RateAction({ tmdbMovieId, filmTitle, hasRated }: { tmdbMovieId: number; filmTitle: string; hasRated: boolean }) {
  const { status } = useAuth();
  const { navigate } = useNavigation();
  const [isPromptOpen, setIsPromptOpen] = useState(false);
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
        <p className="dialog__text">Log in to rate {filmTitle}. Browsing and reading never need an account.</p>
        {/* Mounted only while open, so a typed password never outlives the dialog. */}
        {isPromptOpen && (
          <LoginForm
            autoFocus
            onSuccess={() => {
              setIsPromptOpen(false);
              navigate(ratePath);
            }}
            returnTo={ratePath}
          />
        )}
      </Dialog>
    </>
  );
}
