import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../profile/useCurrentUser";
import { fetchFilmRatings, fetchMyRatings, saveRating } from "./ratingsApi";
import type { Rating } from "./ratingsApi";

/** Below this many ratings the community score is hidden (SPEC §6). */
export const MIN_RATINGS_FOR_SCORE = 3;

export const ratingKeys = {
  film: (tmdbMovieId: number) => ["ratings", tmdbMovieId] as const,
  mine: (authorId: string) => ["ratings", "mine", authorId] as const
};

export type CommunityScore = { average: number; count: number } | { average: null; count: number };

export function communityScore(ratings: Rating[]): CommunityScore {
  const count = ratings.length;
  if (count < MIN_RATINGS_FOR_SCORE) return { average: null, count };
  return { average: ratings.reduce((sum, rating) => sum + rating.score, 0) / count, count };
}

/** All ratings for a film, plus the signed-in user's own (when there is a user). */
export function useFilmRatings(tmdbMovieId: number) {
  const me = useCurrentUser();
  const userId = me.data?.itemId;
  const query = useQuery({
    queryKey: ratingKeys.film(tmdbMovieId),
    queryFn: () => fetchFilmRatings(tmdbMovieId),
    staleTime: 60_000
  });

  const all = query.data ?? [];
  return {
    ...query,
    community: communityScore(all),
    myRating: userId ? all.find((rating) => rating.authorId === userId) : undefined
  };
}

/** The signed-in user's rating history, newest first. Waits for the user, since the filter is their id. */
export function useMyRatings() {
  const me = useCurrentUser();
  const authorId = me.data?.itemId ?? "";
  return useQuery({
    queryKey: ratingKeys.mine(authorId),
    queryFn: () => fetchMyRatings(authorId),
    enabled: authorId !== "",
    staleTime: 60_000
  });
}

export function useSaveRating(tmdbMovieId: number) {
  const queryClient = useQueryClient();
  const me = useCurrentUser();

  return useMutation({
    mutationFn: async (score: number) => {
      const authorId = me.data?.itemId;
      if (!authorId) throw new Error("You need to be signed in to rate.");
      await saveRating({ tmdbMovieId, score, authorId });
      return score;
    },
    onSuccess: () => {
      const authorId = me.data?.itemId;
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ratingKeys.film(tmdbMovieId) }),
        authorId ? queryClient.invalidateQueries({ queryKey: ratingKeys.mine(authorId) }) : undefined
      ]);
    }
  });
}
