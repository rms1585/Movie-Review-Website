import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent } from "react";
import { AppLink } from "../../app/router/navigation";
import { cn } from "../../lib/utils";
import { FadeImage } from "../movies/components/FadeImage";
import { TmdbScore } from "../movies/components/ScoreBadge";
import { releaseYear } from "../movies/format";
import { backdropSource } from "../movies/images";
import { usePrefetchMovie } from "../movies/queries";
import type { MovieSummary } from "../movies/types";

/** A horizontal swipe shorter than this is a wobbly tap, not a request to change slides. */
const SWIPE_THRESHOLD_PX = 50;

function usePageHidden(): boolean {
  const [isHidden, setIsHidden] = useState(() => document.hidden);

  useEffect(() => {
    const handleChange = () => setIsHidden(document.hidden);
    document.addEventListener("visibilitychange", handleChange);
    return () => document.removeEventListener("visibilitychange", handleChange);
  }, []);

  return isHidden;
}

/**
 * Featured trending films over their backdrops, crossfading every 7s
 * (SPEC §7.1, animation.md §4.17). The pause button is required by WCAG
 * 2.2.2; it also stops for hover, keyboard focus, a hidden tab and reduced
 * motion, so a slide never changes under someone reading or about to click.
 */
export function FeaturedHero({ movies }: { movies: MovieSummary[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Backdrops mount on first need (the current and next slide) and stay, so
  // the page never fetches six large images up front or refetches on return.
  const [mountedIndexes, setMountedIndexes] = useState(() => new Set([0, 1]));
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const isPageHidden = usePageHidden();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const slideCount = movies.length;
  const canAutoplay = slideCount > 1 && !prefersReducedMotion;
  const isPlaying = canAutoplay && !isPausedByUser && !isHovering && !hasFocusWithin && !isPageHidden;

  function goTo(index: number) {
    const next = (index + slideCount) % slideCount;
    setActiveIndex(next);
    setMountedIndexes((current) => new Set([...current, next, (next + 1) % slideCount]));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") goTo(activeIndex - 1);
    else if (event.key === "ArrowRight") goTo(activeIndex + 1);
    else return;
    event.preventDefault();
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setHasFocusWithin(false);
  }

  function handlePointerUp(event: PointerEvent) {
    if (swipeStartX === null) return;
    const distance = event.clientX - swipeStartX;
    setSwipeStartX(null);
    if (Math.abs(distance) >= SWIPE_THRESHOLD_PX) goTo(activeIndex + (distance < 0 ? 1 : -1));
  }

  return (
    <section
      aria-label="Featured films"
      aria-roledescription="carousel"
      className="hero-carousel"
      onBlur={handleBlur}
      // Only keyboard focus pauses: a mouse click on Play or a dot also
      // focuses the button in Chrome, and must not stop the slideshow it started.
      onFocus={(event) => event.target.matches(":focus-visible") && setHasFocusWithin(true)}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => event.pointerType === "mouse" && setIsHovering(true)}
      onPointerLeave={() => setIsHovering(false)}
    >
      <div
        aria-live={isPlaying ? "off" : "polite"}
        className="hero"
        onPointerCancel={() => setSwipeStartX(null)}
        onPointerDown={(event) => event.pointerType === "touch" && setSwipeStartX(event.clientX)}
        onPointerUp={handlePointerUp}
      >
        {movies.map((movie, index) => (
          <FeaturedSlide
            hasBackdrop={mountedIndexes.has(index)}
            isActive={index === activeIndex}
            isFirst={index === 0}
            key={movie.id}
            label={`${index + 1} of ${slideCount}`}
            movie={movie}
          />
        ))}
      </div>

      {slideCount > 1 && (
        <div className="hero__bar">
          {/* Sits directly under the slide's "See the film", in the same column. */}
          <div className="hero__dots">
            {movies.map((movie, index) => {
              const isCurrent = index === activeIndex;
              return (
                <button
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={`Show ${movie.title}, film ${index + 1} of ${slideCount}`}
                  className="hero__dot"
                  key={movie.id}
                  onClick={() => goTo(index)}
                  type="button"
                >
                  <span className="hero__dot-track">
                    {/* One clock drives both the visible progress and the advance:
                        the slide changes when this fill finishes, so the two can't
                        drift, and pausing the animation pauses the slideshow. Keyed
                        by slide so every visit starts the fill from empty. */}
                    {isCurrent && (
                      <span
                        className={cn("hero__dot-fill", canAutoplay && "is-timed", !isPlaying && "is-paused")}
                        key={activeIndex}
                        onAnimationEnd={() => goTo(activeIndex + 1)}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="hero__controls">
            <button aria-label="Previous film" className="hero__control" onClick={() => goTo(activeIndex - 1)} type="button">
              <ChevronLeft aria-hidden="true" className="icon" />
            </button>
            <button aria-label="Next film" className="hero__control" onClick={() => goTo(activeIndex + 1)} type="button">
              <ChevronRight aria-hidden="true" className="icon" />
            </button>
            {canAutoplay && (
              <button
                aria-label={isPausedByUser ? "Play slideshow" : "Pause slideshow"}
                className="hero__control hero__control--quiet"
                onClick={() => setIsPausedByUser((paused) => !paused)}
                type="button"
              >
                {isPausedByUser ? <Play aria-hidden="true" className="icon" /> : <Pause aria-hidden="true" className="icon" />}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

type FeaturedSlideProps = {
  movie: MovieSummary;
  label: string;
  isActive: boolean;
  isFirst: boolean;
  hasBackdrop: boolean;
};

function FeaturedSlide({ movie, label, isActive, isFirst, hasBackdrop }: FeaturedSlideProps) {
  const prefetch = usePrefetchMovie();
  const backdrop = hasBackdrop && movie.backdropPath ? backdropSource(movie.backdropPath) : undefined;
  const year = releaseYear(movie.releaseDate);

  return (
    <div
      aria-label={label}
      aria-roledescription="slide"
      className={cn("hero__slide", isActive && "is-active")}
      // Hidden slides stay in the DOM for the crossfade; inert keeps their
      // links out of the tab order and their text away from screen readers.
      ref={(element) => {
        if (element) element.inert = !isActive;
      }}
      role="group"
    >
      {backdrop && (
        <FadeImage
          alt=""
          className="hero__backdrop"
          fetchPriority={isFirst ? "high" : "low"}
          loading="eager"
          sizes="(min-width: 1120px) 1120px, 100vw"
          src={backdrop.src}
          srcSet={backdrop.srcSet}
        />
      )}
      <div className="hero__scrim" />
      <div className="hero__content">
        <h2 className="hero__title">{movie.title}</h2>
        <div className="hero__meta">
          {year && <span>{year}</span>}
          <TmdbScore score={movie.tmdbScore} />
        </div>
        <p className="hero__overview">{movie.overview}</p>
        <div>
          <AppLink
            className="button button--primary"
            onFocus={() => prefetch(movie.id)}
            onPointerEnter={() => prefetch(movie.id)}
            to={`/movie/${movie.id}`}
          >
            See the film
          </AppLink>
        </div>
      </div>
    </div>
  );
}

export function FeaturedHeroSkeleton() {
  return <div aria-hidden="true" className="hero skeleton" />;
}
