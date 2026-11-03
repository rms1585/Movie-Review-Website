import { ErrorState } from "../../shared/ui/ErrorState";
import { EmptyState } from "../../shared/ui/EmptyState";
import { PageHead } from "../../shared/ui/PageHead";
import { AppLink } from "../../app/router/navigation";
import { LoadMore } from "../movies/components/LoadMore";
import { PosterGrid, PosterGridSkeleton } from "../movies/components/PosterGrid";
import { useBrowse } from "../movies/queries";
import { BrowseFiltersPanel } from "./BrowseFiltersPanel";
import { parseBrowseFilters } from "./browseFilters";

export function BrowsePage({ search }: { search: URLSearchParams }) {
  const filters = parseBrowseFilters(search);
  const browse = useBrowse(filters);
  const movies = browse.data?.pages.flatMap((page) => page.movies) ?? [];

  return (
    <>
      <PageHead title="Browse films" />
      <div className="browse">
        <BrowseFiltersPanel filters={filters} />
        <div className="browse__results">
          {browse.isError ? (
            <ErrorState isRetrying={browse.isFetching} onRetry={() => void browse.refetch()} />
          ) : browse.isPending ? (
            <PosterGridSkeleton />
          ) : movies.length === 0 ? (
            <EmptyState
              action={<AppLink className="button button--secondary" to="/browse">Clear filters</AppLink>}
              text="No films match these filters. Try another genre or decade."
              title="Nothing matches"
            />
          ) : (
            <>
              <PosterGrid movies={movies} />
              <LoadMore
                hasMore={browse.hasNextPage}
                isError={browse.isFetchNextPageError}
                isLoading={browse.isFetchingNextPage}
                onLoadMore={() => void browse.fetchNextPage()}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
