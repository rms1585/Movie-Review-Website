import { useMemo } from "react";
import { GenreChips } from "../movies/components/GenreChips";
import { Rail } from "../movies/components/Rail";
import { useHighlyRated, useNewReleases, useTrending } from "../movies/queries";
import type { MovieSummary } from "../movies/types";
import { FeaturedHero, FeaturedHeroSkeleton } from "./FeaturedHero";
import { FeaturedMorph, supportsWebGl } from "./FeaturedMorph";

const FEATURED_COUNT = 6;

/** The top trending films with a backdrop lead the page; a slide without artwork has nothing to show. */
function pickFeatured(movies: MovieSummary[] | undefined): MovieSummary[] {
  return movies?.filter((movie) => movie.backdropPath).slice(0, FEATURED_COUNT) ?? [];
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

  const featured = useMemo(() => pickFeatured(trending.data), [trending.data]);
  const canMorph = useMemo(supportsWebGl, []);
  // The Trending rail keeps every film, carousel ones included: leaving six
  // out would thin the rail more than the repeat costs.
  const claimedForNew = useMemo(() => claimedBefore(trending.data), [trending.data]);
  const claimedForRated = useMemo(() => claimedBefore(trending.data, newReleases.data), [trending.data, newReleases.data]);

  return (
    <div className="home">
      <h1 className="sr-only">Limereel</h1>
      {featured.length > 0 ? (
        canMorph ? <FeaturedMorph movies={featured} /> : <FeaturedHero movies={featured} />
      ) : (
        trending.isPending && <FeaturedHeroSkeleton />
      )}

      <div className="container home__rails">
        <Rail
          isError={trending.isError}
          isLoading={trending.isPending}
          isRetrying={trending.isFetching}
          movies={trending.data}
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
    </div>
  );
}
