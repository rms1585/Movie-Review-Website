import type { MovieDetail, MovieSummary } from "./types";

/**
 * The catalogue rule (SPEC §4.1) as one value, because it is expected to change.
 *
 * TMDB list endpoints carry `original_language` but not production countries,
 * and `discover` silently ignores `without_origin_country` (checked against
 * the live API on 2026-11-03). So lists are filtered by language, and the
 * country check runs on the detail record, where the countries exist.
 */
export const catalogueRule = {
  originalLanguage: "en",
  excludedCountries: ["IN"]
} as const;

const knownExcludedIds = new Set<number>();

export function isAllowedListItem(movie: MovieSummary): boolean {
  return movie.originalLanguage === catalogueRule.originalLanguage && !knownExcludedIds.has(movie.id);
}

export function isInCatalogue(movie: MovieDetail): boolean {
  const excluded = movie.countries.some((code) => (catalogueRule.excludedCountries as readonly string[]).includes(code));
  const allowed = movie.originalLanguage === catalogueRule.originalLanguage && !excluded;
  // Remembered so lists rendered later in this visit drop the film too.
  if (!allowed) knownExcludedIds.add(movie.id);
  return allowed;
}
