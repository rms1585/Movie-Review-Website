import type { BrowseFilters, BrowseSort } from "../movies/types";

export const sortOptions: { value: BrowseSort; label: string }[] = [
  { value: "top-rated", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "most-rated", label: "Most rated" }
];

const FIRST_DECADE = 1950;

/** Newest first: the current decade back to the 1950s. */
export function decadeOptions(): number[] {
  const current = Math.floor(new Date().getFullYear() / 10) * 10;
  const decades: number[] = [];
  for (let decade = current; decade >= FIRST_DECADE; decade -= 10) decades.push(decade);
  return decades;
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

/** Filters live in the URL, so Back, refresh and shared links all keep them. */
export function parseBrowseFilters(search: URLSearchParams): BrowseFilters {
  const sort = search.get("sort");
  const decade = parseNumber(search.get("decade"));
  return {
    genreId: parseNumber(search.get("genre")),
    decade: decade !== null && decadeOptions().includes(decade) ? decade : null,
    sort: sortOptions.some((option) => option.value === sort) ? (sort as BrowseSort) : "top-rated"
  };
}

export function browseHref(filters: BrowseFilters): string {
  const params = new URLSearchParams();
  if (filters.genreId !== null) params.set("genre", String(filters.genreId));
  if (filters.decade !== null) params.set("decade", String(filters.decade));
  if (filters.sort !== "top-rated") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `/browse?${query}` : "/browse";
}
