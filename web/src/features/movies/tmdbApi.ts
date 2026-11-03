import { blocksClient } from "../../lib/blocks/client";
import { catalogueRule, isAllowedListItem } from "./catalogue";
import type { BrowseFilters, Genre, MovieDetail, MoviePage, MovieSummary, SearchResult } from "./types";

// Every TMDB call goes through the Blocks "tmdb" proxy (blocks/logic/tmdb-proxy.json),
// which adds the API token server-side. The proxy is Public, so these calls
// work for logged-out visitors and send no user token.
const PROXY_SLUG = "tmdb";

type Query = Record<string, string | number | boolean | undefined>;

function tmdbGet<T>(path: string, query: Query = {}, signal?: AbortSignal): Promise<T> {
  return blocksClient.logic.proxy.request<T>(PROXY_SLUG, { auth: false, path, query, signal });
}

type RawMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  original_language: string;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
};

type RawPage = { page: number; results: RawMovie[]; total_pages: number };

type RawDetail = RawMovie & {
  tagline?: string;
  runtime?: number | null;
  genres?: Genre[];
  production_countries?: { iso_3166_1: string }[];
  origin_country?: string[];
  credits?: {
    cast?: { id: number; name: string; character?: string; profile_path: string | null }[];
    crew?: { name: string; job: string }[];
  };
  videos?: { results?: { key: string; site: string; type: string; official?: boolean }[] };
  similar?: RawPage;
};

function toSummary(raw: RawMovie): MovieSummary {
  return {
    id: raw.id,
    title: raw.title,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    releaseDate: raw.release_date ?? "",
    originalLanguage: raw.original_language,
    overview: raw.overview ?? "",
    tmdbScore: raw.vote_average ?? 0,
    tmdbVoteCount: raw.vote_count ?? 0
  };
}

function toPage(raw: RawPage): MoviePage {
  return {
    movies: raw.results.map(toSummary).filter(isAllowedListItem),
    page: raw.page,
    // TMDB refuses pages past 500 even when total_pages says more.
    totalPages: Math.min(raw.total_pages, 500)
  };
}

function pickTrailer(videos: RawDetail["videos"]): string | null {
  const youTube = (videos?.results ?? []).filter((video) => video.site === "YouTube" && video.type === "Trailer");
  return (youTube.find((video) => video.official) ?? youTube[0])?.key ?? null;
}

function toDetail(raw: RawDetail): MovieDetail {
  const countries = new Set([
    ...(raw.production_countries ?? []).map((country) => country.iso_3166_1),
    ...(raw.origin_country ?? [])
  ]);
  return {
    ...toSummary(raw),
    tagline: raw.tagline ?? "",
    runtimeMinutes: raw.runtime || null,
    genres: raw.genres ?? [],
    countries: [...countries],
    directors: (raw.credits?.crew ?? []).filter((member) => member.job === "Director").map((member) => member.name),
    cast: (raw.credits?.cast ?? []).slice(0, 12).map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character ?? "",
      profilePath: member.profile_path
    })),
    trailerKey: pickTrailer(raw.videos),
    similar: raw.similar ? toPage(raw.similar).movies : []
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Shared discover filters: English-original, released, enough votes to mean something. */
const baseDiscover: Query = {
  with_original_language: catalogueRule.originalLanguage,
  include_adult: false,
  include_video: false
};

export async function fetchTrending(signal?: AbortSignal): Promise<MovieSummary[]> {
  const raw = await tmdbGet<RawPage>("trending/movie/week", {}, signal);
  return toPage(raw).movies;
}

export async function fetchNewReleases(signal?: AbortSignal): Promise<MovieSummary[]> {
  const raw = await tmdbGet<RawPage>("discover/movie", {
    ...baseDiscover,
    sort_by: "primary_release_date.desc",
    "primary_release_date.lte": today(),
    "vote_count.gte": 20
  }, signal);
  return toPage(raw).movies;
}

export async function fetchHighlyRated(signal?: AbortSignal): Promise<MovieSummary[]> {
  const raw = await tmdbGet<RawPage>("discover/movie", {
    ...baseDiscover,
    sort_by: "vote_average.desc",
    "vote_count.gte": 2000
  }, signal);
  return toPage(raw).movies;
}

export async function fetchGenres(signal?: AbortSignal): Promise<Genre[]> {
  const raw = await tmdbGet<{ genres: Genre[] }>("genre/movie/list", {}, signal);
  return raw.genres;
}

const browseSort: Record<BrowseFilters["sort"], Query> = {
  "top-rated": { sort_by: "vote_average.desc", "vote_count.gte": 300 },
  newest: { sort_by: "primary_release_date.desc", "vote_count.gte": 10 },
  "most-rated": { sort_by: "vote_count.desc" }
};

export async function fetchBrowse(filters: BrowseFilters, page: number, signal?: AbortSignal): Promise<MoviePage> {
  const decadeRange: Query = filters.decade === null
    ? { "primary_release_date.lte": today() }
    : {
      "primary_release_date.gte": `${filters.decade}-01-01`,
      "primary_release_date.lte": `${filters.decade + 9}-12-31`
    };
  const raw = await tmdbGet<RawPage>("discover/movie", {
    ...baseDiscover,
    ...browseSort[filters.sort],
    ...decadeRange,
    with_genres: filters.genreId ?? undefined,
    page
  }, signal);
  return toPage(raw);
}

export async function searchMovies(query: string, page: number, signal?: AbortSignal): Promise<SearchResult> {
  const raw = await tmdbGet<RawPage>("search/movie", { query, page, include_adult: false }, signal);
  const result = toPage(raw);
  return { ...result, onlyExcludedMatches: raw.results.length > 0 && result.movies.length === 0 && page === 1 };
}

export async function fetchMovie(id: number, signal?: AbortSignal): Promise<MovieDetail> {
  const raw = await tmdbGet<RawDetail>(`movie/${id}`, { append_to_response: "credits,videos,similar" }, signal);
  return toDetail(raw);
}
