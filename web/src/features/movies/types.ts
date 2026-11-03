export type MovieSummary = {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  /** ISO date (YYYY-MM-DD), or empty when TMDB has none. */
  releaseDate: string;
  originalLanguage: string;
  overview: string;
  tmdbScore: number;
  tmdbVoteCount: number;
};

export type Genre = { id: number; name: string };

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
};

export type MovieDetail = MovieSummary & {
  tagline: string;
  runtimeMinutes: number | null;
  genres: Genre[];
  /** ISO 3166-1 codes from production_countries and origin_country, merged. */
  countries: string[];
  directors: string[];
  cast: CastMember[];
  /** YouTube key of the official trailer, when TMDB lists one. */
  trailerKey: string | null;
  similar: MovieSummary[];
};

export type MoviePage = {
  movies: MovieSummary[];
  page: number;
  totalPages: number;
};

export type SearchResult = MoviePage & {
  /** TMDB found films, but every one fell outside the catalogue rule. */
  onlyExcludedMatches: boolean;
};

export type BrowseSort = "top-rated" | "newest" | "most-rated";

export type BrowseFilters = {
  genreId: number | null;
  /** First year of the decade, e.g. 1990. */
  decade: number | null;
  sort: BrowseSort;
};
