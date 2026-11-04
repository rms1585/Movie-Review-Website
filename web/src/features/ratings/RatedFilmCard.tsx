import { AppLink } from "../../app/router/navigation";
import { formatShortDate } from "../movies/format";
import { Poster } from "../movies/components/Poster";
import { GRID_POSTER_SIZES } from "../movies/components/PosterGrid";
import { useCachedSummary, useMovie, usePrefetchMovie } from "../movies/queries";
import type { MyRating } from "./ratingsApi";

/**
 * One film from the profile's rating history. Ratings store only the TMDB id,
 * so each card loads its own film; one seen elsewhere on the site shows at once.
 */
export function RatedFilmCard({ rating }: { rating: MyRating }) {
  const id = rating.tmdbMovieId;
  const film = useMovie(id);
  const cached = useCachedSummary(id);
  const prefetch = usePrefetchMovie();
  const movie = film.data ?? cached;
  const ratedOn = formatShortDate(rating.ratedAt);

  return (
    <AppLink
      className="poster-card"
      onFocus={() => prefetch(id)}
      onPointerEnter={() => prefetch(id)}
      title={movie?.title}
      to={`/movie/${id}`}
    >
      <div className="poster-card__art">
        {movie ? (
          <Poster path={movie.posterPath} sizes={GRID_POSTER_SIZES} title={movie.title} />
        ) : film.isError ? (
          <div className="poster poster--missing"><span>Film unavailable</span></div>
        ) : (
          <div aria-hidden="true" className="poster skeleton" />
        )}
      </div>
      {movie ? (
        <span className="poster-card__title">{movie.title}</span>
      ) : film.isError ? (
        <span className="poster-card__title">Film unavailable</span>
      ) : (
        <span aria-hidden="true" className="skeleton skeleton--line" />
      )}
      <span className="poster-card__meta">
        <span className="score score--mine">
          <span className="score__label">You</span>
          <span className="score__value">{rating.score}</span>
          <span className="sr-only"> out of 10</span>
        </span>
        {ratedOn && <span>Rated {ratedOn}</span>}
      </span>
    </AppLink>
  );
}
