import { useState } from "react";
import { AppLink } from "../../app/router/navigation";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { LoadMore } from "../movies/components/LoadMore";
import { PosterGridSkeleton } from "../movies/components/PosterGrid";
import { RatedFilmCard } from "./RatedFilmCard";
import { useMyRatings } from "./useRatings";

/** Each card fetches its film from TMDB, so the list grows a page at a time rather than all at once. */
const RATINGS_PAGE_SIZE = 24;

/** The signed-in user's rating history on their profile, newest first (SPEC §7.7). */
export function MyRatingsSection() {
  const ratings = useMyRatings();
  const [visibleCount, setVisibleCount] = useState(RATINGS_PAGE_SIZE);

  if (ratings.isError) {
    return (
      <section aria-labelledby="my-ratings-title" className="my-ratings">
        <h2 id="my-ratings-title">Your ratings</h2>
        <ErrorState
          isRetrying={ratings.isFetching}
          message="We couldn't load your ratings. Try again shortly."
          onRetry={() => void ratings.refetch()}
        />
      </section>
    );
  }

  if (ratings.isPending) {
    return (
      <section aria-labelledby="my-ratings-title" className="my-ratings">
        <h2 id="my-ratings-title">Your ratings</h2>
        <PosterGridSkeleton count={5} />
        <p className="sr-only" role="status">Loading your ratings…</p>
      </section>
    );
  }

  if (ratings.data.length === 0) {
    return (
      <EmptyState
        action={<AppLink className="button button--secondary" to="/browse">Find a film to rate</AppLink>}
        text="Films you rate show up here, newest first."
        title="No ratings yet"
      />
    );
  }

  const visible = ratings.data.slice(0, visibleCount);

  return (
    <section aria-labelledby="my-ratings-title" className="my-ratings">
      <h2 id="my-ratings-title">Your ratings</h2>
      <ul className="poster-grid">
        {visible.map((rating) => (
          <li key={rating.id}><RatedFilmCard rating={rating} /></li>
        ))}
      </ul>
      <LoadMore
        hasMore={visibleCount < ratings.data.length}
        isError={false}
        isLoading={false}
        onLoadMore={() => setVisibleCount((count) => count + RATINGS_PAGE_SIZE)}
      />
    </section>
  );
}
