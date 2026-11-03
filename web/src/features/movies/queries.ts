import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchBrowse,
  fetchGenres,
  fetchHighlyRated,
  fetchMovie,
  fetchNewReleases,
  fetchTrending,
  searchMovies
} from "./tmdbApi";
import type { BrowseFilters, MoviePage, MovieSummary } from "./types";

// Film data changes slowly, so it is treated as fresh for a while and a
// visitor moving between pages never refetches what they just saw.
const FILM_STALE_MS = 10 * 60_000;
const GENRES_STALE_MS = 24 * 60 * 60_000;

export const movieKeys = {
  trending: ["tmdb", "trending"] as const,
  newReleases: ["tmdb", "new-releases"] as const,
  highlyRated: ["tmdb", "highly-rated"] as const,
  genres: ["tmdb", "genres"] as const,
  browse: (filters: BrowseFilters) => ["tmdb", "browse", filters] as const,
  search: (query: string) => ["tmdb", "search", query] as const,
  suggestions: (query: string) => ["tmdb", "suggestions", query] as const,
  movie: (id: number) => ["tmdb", "movie", id] as const
};

export function useTrending() {
  return useQuery({ queryKey: movieKeys.trending, queryFn: ({ signal }) => fetchTrending(signal), staleTime: FILM_STALE_MS });
}

export function useNewReleases() {
  return useQuery({ queryKey: movieKeys.newReleases, queryFn: ({ signal }) => fetchNewReleases(signal), staleTime: FILM_STALE_MS });
}

export function useHighlyRated() {
  return useQuery({ queryKey: movieKeys.highlyRated, queryFn: ({ signal }) => fetchHighlyRated(signal), staleTime: FILM_STALE_MS });
}

export function useGenres() {
  return useQuery({ queryKey: movieKeys.genres, queryFn: ({ signal }) => fetchGenres(signal), staleTime: GENRES_STALE_MS });
}

export function useMovie(id: number) {
  return useQuery({ queryKey: movieKeys.movie(id), queryFn: ({ signal }) => fetchMovie(id, signal), staleTime: FILM_STALE_MS });
}

export function useBrowse(filters: BrowseFilters) {
  return useInfiniteQuery({
    queryKey: movieKeys.browse(filters),
    queryFn: ({ pageParam, signal }) => fetchBrowse(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: FILM_STALE_MS
  });
}

export function useSearch(query: string) {
  return useInfiniteQuery({
    queryKey: movieKeys.search(query),
    queryFn: ({ pageParam, signal }) => searchMovies(query, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: query.length > 0,
    staleTime: FILM_STALE_MS
  });
}

/** Live suggestions keep showing the previous list while the next one loads, so the dropdown never flickers empty. */
export function useSuggestions(query: string) {
  return useQuery({
    queryKey: movieKeys.suggestions(query),
    // TMDB's own order puts obscure exact-title matches first ("inter" before
    // Interstellar); five slots go further ranked by how widely a film is rated.
    queryFn: async ({ signal }) => [...(await searchMovies(query, 1, signal)).movies]
      .sort((a, b) => b.tmdbVoteCount - a.tmdbVoteCount)
      .slice(0, 5),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: FILM_STALE_MS
  });
}

function findSummary(data: unknown, id: number): MovieSummary | undefined {
  // The genre list is also an array under ["tmdb"]; requiring a title keeps a genre id from matching.
  if (Array.isArray(data)) return data.find((item: Partial<MovieSummary>) => item?.id === id && typeof item.title === "string");
  if (data && typeof data === "object" && "pages" in data) {
    for (const page of (data as { pages: MoviePage[] }).pages) {
      const match = page.movies.find((movie) => movie.id === id);
      if (match) return match;
    }
  }
  return undefined;
}

/**
 * The film as already seen in a rail, grid or search result, so its page can
 * show the clicked poster while the full record loads (animation.md §4.1).
 */
export function useCachedSummary(id: number): MovieSummary | undefined {
  const queryClient = useQueryClient();
  for (const [, data] of queryClient.getQueriesData({ queryKey: ["tmdb"] })) {
    const match = findSummary(data, id);
    if (match) return match;
  }
  return undefined;
}

/** Starts loading a film's page on hover, so the poster transition lands on real content (animation.md §6.7). */
export function usePrefetchMovie() {
  const queryClient = useQueryClient();
  return useCallback((id: number) => {
    void queryClient.prefetchQuery({ queryKey: movieKeys.movie(id), queryFn: ({ signal }) => fetchMovie(id, signal), staleTime: FILM_STALE_MS });
  }, [queryClient]);
}
