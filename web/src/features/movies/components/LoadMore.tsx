type LoadMoreProps = {
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  onLoadMore: () => void;
};

/** A button rather than infinite scroll, so the footer stays reachable and keyboard users stay in control. */
export function LoadMore({ hasMore, isLoading, isError, onLoadMore }: LoadMoreProps) {
  if (!hasMore) return null;

  return (
    <div className="load-more">
      {isError && <p className="load-more__error" role="alert">Couldn't load more films.</p>}
      <button aria-disabled={isLoading} className="button button--secondary" onClick={isLoading ? undefined : onLoadMore} type="button">
        {isLoading ? "Loading…" : isError ? "Try again" : "Load more"}
      </button>
    </div>
  );
}
