import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { AppLink } from "../../../app/router/navigation";
import { ErrorState } from "../../../shared/ui/ErrorState";
import type { MovieSummary } from "../types";
import { PosterCard, PosterCardSkeleton } from "./PosterCard";

const RAIL_POSTER_SIZES = "(min-width: 768px) 154px, 30vw";
const SKELETON_COUNT = 8;

type RailProps = {
  title: string;
  seeAllTo?: string;
  movies: MovieSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  /** Ids already shown higher on the page; their cards don't claim the shared poster. */
  claimedIds?: Set<number>;
  emptyText?: ReactNode;
};

/** A titled, horizontally scrolling row of posters with snap points (design.md §7.4). */
export function Rail({ title, seeAllTo, movies, isLoading, isError, isRetrying, onRetry, claimedIds, emptyText }: RailProps) {
  const headingId = useId();
  const scrollerRef = useRef<HTMLUListElement>(null);

  function scrollByPage(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby={headingId} className="rail">
      <div className="rail__head">
        <h2 id={headingId}>{title}</h2>
        {seeAllTo && <AppLink className="link" to={seeAllTo}>See all</AppLink>}
      </div>

      {isError ? (
        <ErrorState isRetrying={isRetrying} onRetry={onRetry} />
      ) : movies && movies.length === 0 ? (
        <p className="rail__empty">{emptyText ?? "Nothing to show here yet."}</p>
      ) : (
        <div className="rail__viewport">
          <button aria-label={`Scroll ${title} back`} className="rail__arrow rail__arrow--back" onClick={() => scrollByPage(-1)} tabIndex={-1} type="button">
            <ChevronLeft aria-hidden="true" className="icon" />
          </button>
          <ul aria-busy={isLoading} className="rail__track" ref={scrollerRef}>
            {isLoading || !movies
              ? Array.from({ length: SKELETON_COUNT }, (_, index) => <li key={index}><PosterCardSkeleton /></li>)
              : movies.map((movie) => (
                <li key={movie.id}>
                  <PosterCard movie={movie} sharePoster={!claimedIds?.has(movie.id)} sizes={RAIL_POSTER_SIZES} />
                </li>
              ))}
          </ul>
          <button aria-label={`Scroll ${title} forward`} className="rail__arrow rail__arrow--forward" onClick={() => scrollByPage(1)} tabIndex={-1} type="button">
            <ChevronRight aria-hidden="true" className="icon" />
          </button>
        </div>
      )}
    </section>
  );
}
