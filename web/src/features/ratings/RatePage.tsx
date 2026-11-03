import { Check } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { AppLink } from "../../app/router/navigation";
import { distance, duration } from "../../lib/motion";
import { ErrorState } from "../../shared/ui/ErrorState";
import { StatusLine } from "../../shared/ui/StatusLine";
import { isInCatalogue } from "../movies/catalogue";
import { Poster } from "../movies/components/Poster";
import { releaseYear } from "../movies/format";
import { useMovie } from "../movies/queries";
import { RatingControl } from "./RatingControl";
import { useFilmRatings, useSaveRating } from "./useRatings";

/**
 * Arrow keys step through scores one at a time, so keyboard choices wait for a
 * pause before saving; a tap saves at once (SPEC §7.5).
 */
const KEYBOARD_SAVE_DELAY_MS = 600;

type SaveState = "idle" | "saving" | "saved" | "error";

export function RatePage({ tmdbMovieId }: { tmdbMovieId: number }) {
  const movie = useMovie(tmdbMovieId);
  const ratings = useFilmRatings(tmdbMovieId);
  const save = useSaveRating(tmdbMovieId);
  const headingId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timerRef = useRef<number>();
  const latestRef = useRef<number | null>(null);
  // Saves run one at a time: two overlapping first saves would each find no
  // rating yet and both create one.
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  // Start from the score already saved, once it is known.
  const savedScore = ratings.myRating?.score ?? null;
  useEffect(() => {
    if (selected === null && savedScore !== null) setSelected(savedScore);
  }, [savedScore, selected]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function persist(score: number) {
    latestRef.current = score;
    setSaveState("saving");
    queueRef.current = queueRef.current.then(async () => {
      // A newer choice is already queued; it saves instead and reports for itself.
      if (latestRef.current !== score) return;
      try {
        await save.mutateAsync(score);
        if (latestRef.current === score) setSaveState("saved");
      } catch {
        if (latestRef.current === score) setSaveState("error");
      }
    });
  }

  function handleChange(score: number, source: "pointer" | "keyboard") {
    setSelected(score);
    setSaveState("idle");
    window.clearTimeout(timerRef.current);
    if (source === "pointer") {
      persist(score);
    } else {
      timerRef.current = window.setTimeout(() => persist(score), KEYBOARD_SAVE_DELAY_MS);
    }
  }

  if (movie.isError) return <ErrorState isRetrying={movie.isFetching} onRetry={() => void movie.refetch()} />;
  if (movie.isPending || ratings.isPending) return <StatusLine label="Loading…" />;
  if (!isInCatalogue(movie.data)) {
    return (
      <div className="stack">
        <h1>Not in our catalogue</h1>
        <p>We focus on English-language films, so this title can't be rated here.</p>
      </div>
    );
  }

  const film = movie.data;
  const year = releaseYear(film.releaseDate);

  return (
    <article className="rate">
      <div className="rate__film">
        <div className="rate__poster">
          <Poster path={film.posterPath} sizes="96px" title={film.title} />
        </div>
        <div className="rate__film-text">
          <h1>{film.title}</h1>
          {year && <p className="rate__year">{year}</p>}
        </div>
      </div>

      <section aria-labelledby={headingId} className="rate__section">
        <div className="rate__label-row">
          <h2 className="rate__label" id={headingId}>Your score</h2>
          <p aria-live="polite" className="rate__status">
            <AnimatePresence mode="wait">
              {saveState === "saved" && (
                <m.span
                  animate={{ opacity: 1, y: 0 }}
                  className="rate__saved"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0, y: distance.xs }}
                  key="saved"
                  transition={{ duration: duration.fast }}
                >
                  <Check aria-hidden="true" className="icon" />
                  Saved
                </m.span>
              )}
              {saveState === "saving" && <span key="saving">Saving…</span>}
            </AnimatePresence>
          </p>
        </div>
        <RatingControl labelledBy={headingId} onChange={handleChange} value={selected} />
        {saveState === "error" && selected !== null && (
          <ErrorState
            isRetrying={save.isPending}
            message="We couldn't save your score. Your choice is kept, so you can try again."
            onRetry={() => persist(selected)}
          />
        )}
      </section>

      <div>
        <AppLink className="button button--secondary" to={`/movie/${film.id}`}>
          {saveState === "saved" ? "Done" : "Back to the film"}
        </AppLink>
      </div>
    </article>
  );
}
