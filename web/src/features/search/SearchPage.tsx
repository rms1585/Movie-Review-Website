import { AppLink } from "../../app/router/navigation";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { PageHead } from "../../shared/ui/PageHead";
import { LoadMore } from "../movies/components/LoadMore";
import { PosterGrid, PosterGridSkeleton } from "../movies/components/PosterGrid";
import { Rail } from "../movies/components/Rail";
import { useSearch, useTrending } from "../movies/queries";

export function SearchPage({ query }: { query: string }) {
  const trimmed = query.trim();
  const search = useSearch(trimmed);

  if (!trimmed) {
    return (
      <>
        <PageHead title="Search" />
        <EmptyState action={<AppLink className="button button--secondary" to="/browse">Browse films</AppLink>} text="Type a film title in the search bar above." title="Search for a film" />
      </>
    );
  }

  const movies = search.data?.pages.flatMap((page) => page.movies) ?? [];
  const onlyExcluded = search.data?.pages[0]?.onlyExcludedMatches ?? false;

  return (
    <>
      <PageHead title={`Results for “${trimmed}”`} />
      {search.isError ? (
        <ErrorState isRetrying={search.isFetching} onRetry={() => void search.refetch()} />
      ) : search.isPending ? (
        <PosterGridSkeleton />
      ) : movies.length === 0 ? (
        <NoResults onlyExcluded={onlyExcluded} query={trimmed} />
      ) : (
        <>
          <PosterGrid movies={movies} />
          <LoadMore
            hasMore={search.hasNextPage}
            isError={search.isFetchNextPageError}
            isLoading={search.isFetchingNextPage}
            onLoadMore={() => void search.fetchNextPage()}
          />
        </>
      )}
    </>
  );
}

/** Never a dead end: both empty cases offer Trending and Browse (SPEC §7.2, Flow 5). */
function NoResults({ query, onlyExcluded }: { query: string; onlyExcluded: boolean }) {
  const trending = useTrending();

  return (
    <div className="stack">
      <EmptyState
        action={<AppLink className="button button--secondary" to="/browse">Browse genres</AppLink>}
        text={onlyExcluded ? "We focus on English-language films, so this title isn't here." : "Check the spelling, or try fewer words."}
        title={onlyExcluded ? "Not in our catalogue" : `No films match “${query}”`}
      />
      <Rail
        isError={trending.isError}
        isLoading={trending.isPending}
        isRetrying={trending.isFetching}
        movies={trending.data}
        onRetry={() => void trending.refetch()}
        title="Trending now"
      />
    </div>
  );
}
