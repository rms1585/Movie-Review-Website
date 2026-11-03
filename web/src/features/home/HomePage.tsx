import { useMemo } from "react";
import { GenreChips } from "../movies/components/GenreChips";
import { Rail } from "../movies/components/Rail";
import { useHighlyRated, useNewReleases, useTrending } from "../movies/queries";
import type { MovieSummary } from "../movies/types";
import { FeaturedHero, FeaturedHeroSkeleton } from "./FeaturedHero";

/** The first trending film with a backdrop leads the page; a hero without artwork has nothing to show. */
function pickFeatured(movies: MovieSummary[] | undefined): MovieSummary | undefined {
  return movies?.find((movie) => movie.backdropPath);
}

/**
 * Each film id may own the shared poster transition once per page. Later
 * rails repeating a film give up the claim, so Motion never sees duplicates.
 */
function claimedBefore(...lists: (MovieSummary[] | undefined)[]): Set<number> {
  return new Set(lists.flatMap((list) => list?.map((movie) => movie.id) ?? []));
}

export function HomePage() {
  const trending = useTrending();
  const newReleases = useNewReleases();
  const highlyRated = useHighlyRated();

  const featured = pickFeatured(trending.data);
  const trendingRest = useMemo(() => trending.data?.filter((movie) => movie.id !== featured?.id), [trending.data, featured]);
  const claimedForNew = useMemo(() => claimedBefore(trendingRest), [trendingRest]);
  const claimedForRated = useMemo(() => claimedBefore(trendingRest, newReleases.data), [trendingRest, newReleases.data]);

  return (
    <div className="home">
      <h1 className="sr-only">Limereel</h1>
      {featured ? <FeaturedHero movie={featured} /> : trending.isPending && <FeaturedHeroSkeleton />}

      <Rail
        isError={trending.isError}
        isLoading={trending.isPending}
        isRetrying={trending.isFetching}
        movies={trendingRest}
        onRetry={() => void trending.refetch()}
        title="Trending now"
      />
      <Rail
        claimedIds={claimedForNew}
        isError={newReleases.isError}
        isLoading={newReleases.isPending}
        isRetrying={newReleases.isFetching}
        movies={newReleases.data}
        onRetry={() => void newReleases.refetch()}
        seeAllTo="/browse?sort=newest"
        title="New releases"
      />
      {/* Labelled as TMDB's ranking until our own ratings exist; "top rated by
          our community" would be a claim the site can't back yet. */}
      <Rail
        claimedIds={claimedForRated}
        isError={highlyRated.isError}
        isLoading={highlyRated.isPending}
        isRetrying={highlyRated.isFetching}
        movies={highlyRated.data}
        onRetry={() => void highlyRated.refetch()}
        seeAllTo="/browse?sort=top-rated"
        title="Highly rated on TMDB"
      />
      <GenreChips />
    </div>
  );
}
