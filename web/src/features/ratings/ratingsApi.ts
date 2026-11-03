import { blocksClient } from "../../lib/blocks/client";

// Rating records live in the Blocks "Rating" schema (blocks/data/schemas/Rating.json).
// Reads are Public so logged-out visitors see community scores; writes and
// edits need a session and only touch the caller's own records. The author
// is the platform's CreatedBy field, never a value the browser sends.
const ratings = blocksClient.data.collection<RatingRecord>("Rating", { fields: ["tmdbMovieId", "score", "CreatedBy"] });

/**
 * Every rating for a film is read in one page and averaged in the browser.
 * Fine at this size; past a few thousand ratings per film the average should
 * move server-side.
 */
const FILM_RATINGS_PAGE_SIZE = 1000;

type RatingRecord = Record<string, unknown> & {
  ItemId?: string;
  tmdbMovieId?: number;
  score?: number;
  CreatedBy?: string;
};

export type Rating = { id: string; score: number; authorId: string };

type ListResponse = { data?: { getRatings?: { items?: RatingRecord[] } } };

function toRating(record: RatingRecord): Rating | undefined {
  if (!record.ItemId || typeof record.score !== "number") return undefined;
  return { id: record.ItemId, score: record.score, authorId: record.CreatedBy ?? "" };
}

export async function fetchFilmRatings(tmdbMovieId: number): Promise<Rating[]> {
  const response = (await ratings.list({
    pageNo: 1,
    pageSize: FILM_RATINGS_PAGE_SIZE,
    filter: { tmdbMovieId }
  })) as ListResponse;
  return (response.data?.getRatings?.items ?? []).map(toRating).filter((rating): rating is Rating => Boolean(rating));
}

/**
 * One rating per person per film: an existing rating is updated, otherwise a
 * new one is created. The caller passes the id it already knows; this re-reads
 * first so a rating saved in another tab is updated rather than duplicated.
 */
export async function saveRating(params: { tmdbMovieId: number; score: number; authorId: string }): Promise<void> {
  const existing = (await fetchFilmRatings(params.tmdbMovieId)).find((rating) => rating.authorId === params.authorId);
  if (existing) {
    await ratings.update(existing.id, { score: params.score });
    return;
  }
  await ratings.create({ tmdbMovieId: params.tmdbMovieId, score: params.score });
}
