import { useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { AppLink } from "../../app/router/navigation";
import MorphSlider from "../../shared/ui/MorphSlider/MorphSlider";
import type { MorphSliderItem } from "../../shared/ui/MorphSlider/MorphSlider";
import { TmdbScore } from "../movies/components/ScoreBadge";
import { releaseYear } from "../movies/format";
import { backdropSource } from "../movies/images";
import { usePrefetchMovie } from "../movies/queries";
import type { MovieSummary } from "../movies/types";

/** The morph is drawn with WebGL; without it the classic banner shows instead. */
export function supportsWebGl(): boolean {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The home banner with React Bits' MorphSlider underneath: each trending
 * film's backdrop melts into the next. The title, plot and "See the film"
 * stay real text on top, following whichever slide is on screen.
 */
export function FeaturedMorph({ movies }: { movies: MovieSummary[] }) {
  const prefetch = usePrefetchMovie();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);

  // WebGL may only read images fetched with CORS. The same stills are often
  // already cached from a plain <img> without that permission, which would
  // block them here, so the slider asks for its own copies.
  const items = useMemo<MorphSliderItem[]>(
    () => movies.map((movie) => ({ image: `${backdropSource(movie.backdropPath ?? "").src}?cors=1` })),
    [movies]
  );

  const movie = movies[activeIndex] ?? movies[0];
  if (!movie) return null;
  const year = releaseYear(movie.releaseDate);

  return (
    <section aria-label="Featured films" className="hero-carousel hero-morph">
      <div className="hero">
        <MorphSlider
          aberration={0.35}
          // Never moves on its own for people who ask for reduced motion.
          autoplay={!prefersReducedMotion}
          autoplayDelay={7}
          className="hero-morph__slider"
          drift={0.4}
          duration={1.1}
          intensity={0.55}
          items={items}
          onChange={setActiveIndex}
          radius={0}
          showCaptions={false}
          transition="melt"
        />
        <div aria-hidden="true" className="hero__scrim hero-morph__scrim" />
        <div className="hero-morph__content" key={movie.id}>
          <h2 className="hero__title">{movie.title}</h2>
          <div className="hero__meta">
            {year && <span>{year}</span>}
            <TmdbScore score={movie.tmdbScore} />
          </div>
          <p className="hero__overview">{movie.overview}</p>
          <div>
            <AppLink
              className="button button--primary hero-morph__action"
              onFocus={() => prefetch(movie.id)}
              onPointerEnter={() => prefetch(movie.id)}
              to={`/movie/${movie.id}`}
            >
              See the film
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
