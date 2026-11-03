import { AppLink } from "../../app/router/navigation";
import { FadeImage } from "../movies/components/FadeImage";
import { TmdbScore } from "../movies/components/ScoreBadge";
import { releaseYear } from "../movies/format";
import { backdropSource } from "../movies/images";
import { usePrefetchMovie } from "../movies/queries";
import type { MovieSummary } from "../movies/types";

/** One featured trending film over its backdrop (SPEC §7.1). No zoom, parallax or video (animation.md §4.17). */
export function FeaturedHero({ movie }: { movie: MovieSummary }) {
  const prefetch = usePrefetchMovie();
  const backdrop = movie.backdropPath ? backdropSource(movie.backdropPath) : undefined;
  const year = releaseYear(movie.releaseDate);

  return (
    <section aria-labelledby="featured-title" className="hero">
      {backdrop && (
        <FadeImage
          alt=""
          className="hero__backdrop"
          fetchPriority="high"
          loading="eager"
          sizes="(min-width: 1120px) 1120px, 100vw"
          src={backdrop.src}
          srcSet={backdrop.srcSet}
        />
      )}
      <div className="hero__scrim" />
      <div className="hero__content">
        <h2 className="hero__title" id="featured-title">{movie.title}</h2>
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
    </section>
  );
}

export function FeaturedHeroSkeleton() {
  return <div aria-hidden="true" className="hero skeleton" />;
}
