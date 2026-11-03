import { m } from "motion/react";
import { AppLink } from "../../../app/router/navigation";
import { spring } from "../../../lib/motion";
import { releaseYear } from "../format";
import { usePrefetchMovie } from "../queries";
import type { MovieSummary } from "../types";
import { Poster } from "./Poster";
import { TmdbScore } from "./ScoreBadge";

type PosterCardProps = {
  movie: MovieSummary;
  sizes: string;
  /** Rails show the same film twice at most; only one card may own the shared poster id. */
  sharePoster?: boolean;
};

/** The whole card is one link and one tab stop (design.md §7.3). */
export function PosterCard({ movie, sizes, sharePoster = true }: PosterCardProps) {
  const prefetch = usePrefetchMovie();
  const year = releaseYear(movie.releaseDate);

  return (
    <AppLink
      className="poster-card"
      onFocus={() => prefetch(movie.id)}
      onPointerEnter={() => prefetch(movie.id)}
      title={movie.title}
      to={`/movie/${movie.id}`}
    >
      <m.div className="poster-card__art" layoutId={sharePoster ? `poster-${movie.id}` : undefined} transition={spring.smooth}>
        <Poster path={movie.posterPath} sizes={sizes} title={movie.title} />
      </m.div>
      <span className="poster-card__title">{movie.title}</span>
      <span className="poster-card__meta">
        {year && <span>{year}</span>}
        <TmdbScore score={movie.tmdbScore} />
      </span>
    </AppLink>
  );
}

export function PosterCardSkeleton() {
  return (
    <div aria-hidden="true" className="poster-card">
      <div className="poster skeleton" />
      <span className="skeleton skeleton--line" />
      <span className="skeleton skeleton--line skeleton--short" />
    </div>
  );
}
