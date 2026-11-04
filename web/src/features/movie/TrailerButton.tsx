import { Play } from "lucide-react";
import { useState } from "react";
import { Dialog } from "../../shared/ui/Dialog";

/**
 * Plays the trailer in a pop-up instead of sending people to YouTube, using
 * YouTube's privacy-enhanced (youtube-nocookie) player. The player only
 * exists while the dialog is open, so closing it stops the video.
 */
export function TrailerButton({ trailerKey, filmTitle }: { trailerKey: string; filmTitle: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const title = `${filmTitle} trailer`;

  return (
    <>
      <button className="button button--secondary" onClick={() => setIsOpen(true)} type="button">
        <Play aria-hidden="true" className="icon" />
        Watch trailer
      </button>
      <Dialog onClose={() => setIsOpen(false)} open={isOpen} title={title} variant="media">
        {isOpen && (
          <div className="trailer">
            <iframe
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="trailer__player"
              // YouTube refuses to play embeds that arrive without a referrer.
              referrerPolicy="strict-origin-when-cross-origin"
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailerKey)}?autoplay=1&rel=0`}
              title={title}
            />
          </div>
        )}
        {/* Some studios block playback outside YouTube; this is the way out. */}
        <p className="trailer__fallback">
          Not playing?{" "}
          <a className="text-button" href={`https://www.youtube.com/watch?v=${trailerKey}`} rel="noopener noreferrer" target="_blank">
            Watch on YouTube<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </Dialog>
    </>
  );
}
