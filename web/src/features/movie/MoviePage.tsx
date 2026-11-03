import { BlocksApiError } from "@seliseblocks/client";
import { Play } from "lucide-react";
import { m } from "motion/react";
import { useEffect } from "react";
import { AppLink } from "../../app/router/navigation";
import { distance, duration, ease, spring } from "../../lib/motion";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { isInCatalogue } from "../movies/catalogue";
import { FadeImage } from "../movies/components/FadeImage";
import { Poster } from "../movies/components/Poster";
import { Rail } from "../movies/components/Rail";
import { CommunityScore, CommunityScorePending, TmdbScore } from "../movies/components/ScoreBadge";
import { RateAction } from "../ratings/RateAction";
import { useFilmRatings } from "../ratings/useRatings";
import { formatReleaseDate, formatRuntime, releaseYear } from "../movies/format";
import { backdropSource } from "../movies/images";
import { useCachedSummary, useMovie } from "../movies/queries";
import type { MovieDetail } from "../movies/types";
import { CastList } from "./CastList";

const DETAIL_POSTER_SIZES = "(min-width: 768px) 300px, 40vw";

function isNotFound(error: unknown): boolean {
  return error instanceof BlocksApiError && error.status === 404;
}

export function MoviePage({ id }: { id: number }) {
  const movie = useMovie(id);

  useEffect(() => {
    if (movie.data) document.title = `${movie.data.title} · Limereel`;
    return () => {
      document.title = "Limereel";
    };
  }, [movie.data]);

  if (movie.isError) {
    if (isNotFound(movie.error)) return <NotInCatalogue reason="missing" />;
    return <ErrorState isRetrying={movie.isFetching} onRetry={() => void movie.refetch()} />;
  }

  if (movie.isPending) return <MovieDetailSkeleton id={id} />;
  if (!isInCatalogue(movie.data)) return <NotInCatalogue reason="excluded" />;
  return <MovieDetailView movie={movie.data} />;
}

function MovieDetailView({ movie }: { movie: MovieDetail }) {
  const ratings = useFilmRatings(movie.id);
  const year = releaseYear(movie.releaseDate);
  const backdrop = movie.backdropPath ? backdropSource(movie.backdropPath) : undefined;

  return (
    <article className="movie">
      <div className="movie__backdrop" aria-hidden="true">
        {backdrop && <FadeImage alt="" fetchPriority="high" loading="eager" sizes="100vw" src={backdrop.src} srcSet={backdrop.srcSet} />}
        <div className="movie__scrim" />
      </div>

      <div className="movie__header">
        {/* Shares its layoutId with the card that was clicked, so the poster
            travels into place (animation.md §4.1); on a direct visit there is
            no card, and it simply appears with the page. */}
        <m.div className="movie__poster" layoutId={`poster-${movie.id}`} transition={spring.smooth}>
          <Poster eager path={movie.posterPath} sizes={DETAIL_POSTER_SIZES} title={movie.title} />
        </m.div>

        <m.div
          animate={{ opacity: 1, y: 0 }}
          className="movie__intro"
          initial={{ opacity: 0, y: distance.sm }}
          transition={{ duration: duration.base, ease: ease.enter, delay: 0.06 }}
        >
          <h1 className="movie__title">{movie.title}</h1>
          <ul className="movie__facts">
            {year && <li>{year}</li>}
            {movie.runtimeMinutes && <li>{formatRuntime(movie.runtimeMinutes)}</li>}
            {movie.genres.map((genre) => <li key={genre.id}>{genre.name}</li>)}
          </ul>
          <div className="movie__scores">
            {ratings.community.average !== null
              ? <CommunityScore average={ratings.community.average} count={ratings.community.count} size="lg" />
              : <CommunityScorePending size="lg" />}
            <TmdbScore score={movie.tmdbScore} size="lg" votes={movie.tmdbVoteCount} />
          </div>
          {ratings.myRating && (
            <p className="movie__my-rating">
              You rated it <strong>{ratings.myRating.score}</strong> out of 10
            </p>
          )}
          <div className="movie__actions">
            <RateAction filmTitle={movie.title} hasRated={Boolean(ratings.myRating)} tmdbMovieId={movie.id} />
            {movie.trailerKey && (
              <a
                className="button button--secondary"
                href={`https://www.youtube.com/watch?v=${movie.trailerKey}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Play aria-hidden="true" className="icon" />
                Watch trailer
                <span className="sr-only">(opens YouTube in a new tab)</span>
              </a>
            )}
          </div>
        </m.div>
      </div>

      <m.div
        animate={{ opacity: 1, y: 0 }}
        className="movie__body"
        initial={{ opacity: 0, y: distance.sm }}
        transition={{ duration: duration.base, ease: ease.enter, delay: 0.06 }}
      >
        <div className="movie__main">
          <section aria-labelledby="plot-heading" className="movie__section">
            <h2 id="plot-heading">Plot</h2>
            {movie.tagline && <p className="movie__tagline">{movie.tagline}</p>}
            <p className="movie__overview">{movie.overview || "TMDB has no plot summary for this film yet."}</p>
          </section>

          {movie.cast.length > 0 && <CastList cast={movie.cast} />}
        </div>

        <aside aria-labelledby="details-heading" className="movie__aside">
          <h2 id="details-heading">Details</h2>
          <dl className="details-list">
            {movie.directors.length > 0 && (
              <div>
                <dt>{movie.directors.length > 1 ? "Directors" : "Director"}</dt>
                <dd>{movie.directors.join(", ")}</dd>
              </div>
            )}
            {movie.releaseDate && (
              <div>
                <dt>Released</dt>
                <dd>{formatReleaseDate(movie.releaseDate)}</dd>
              </div>
            )}
            {movie.runtimeMinutes && (
              <div>
                <dt>Runtime</dt>
                <dd>{formatRuntime(movie.runtimeMinutes)}</dd>
              </div>
            )}
          </dl>
        </aside>
      </m.div>

      {movie.similar.length > 0 && (
        <Rail isError={false} isLoading={false} isRetrying={false} movies={movie.similar} onRetry={() => undefined} title="Similar films" />
      )}
    </article>
  );
}

function MovieDetailSkeleton({ id }: { id: number }) {
  const summary = useCachedSummary(id);

  return (
    <div aria-busy="true" className="movie">
      <div className="movie__backdrop skeleton" />
      <div className="movie__header">
        {/* Keeps the shared poster id, and the poster already on screen, so the
            transition starts at once instead of waiting for the full record. */}
        <m.div className="movie__poster" layoutId={`poster-${id}`} transition={spring.smooth}>
          {summary
            ? <Poster eager path={summary.posterPath} sizes={DETAIL_POSTER_SIZES} title={summary.title} />
            : <div className="poster skeleton" />}
        </m.div>
        <div className="movie__intro">
          {summary
            ? <h1 className="movie__title">{summary.title}</h1>
            : <span className="skeleton skeleton--title" />}
          <span className="skeleton skeleton--line skeleton--short" />
        </div>
      </div>
      <p className="sr-only" role="status">Loading film…</p>
    </div>
  );
}

function NotInCatalogue({ reason }: { reason: "excluded" | "missing" }) {
  return (
    <>
      <h1 className="sr-only">Film not available</h1>
      <EmptyState
        action={<AppLink className="button button--secondary" to="/browse">Browse films</AppLink>}
        text={reason === "excluded"
          ? "We focus on English-language films, so this title isn't here."
          : "We couldn't find this film. The link may be old or mistyped."}
        title="Not in our catalogue"
      />
    </>
  );
}
