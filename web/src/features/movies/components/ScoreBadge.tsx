import { cn } from "../../../lib/utils";
import { formatAverage, formatCount } from "../format";

type Size = "sm" | "lg";

/**
 * TMDB's score: outlined and labelled, so it never reads as ours even
 * without colour (design.md §2.3). Our community score arrives with ratings.
 */
export function TmdbScore({ score, votes, size = "sm" }: { score: number; votes?: number; size?: Size }) {
  if (score <= 0) return null;

  return (
    <span className={cn("score score--tmdb", size === "lg" && "score--lg")}>
      <span className="score__label">TMDB</span>
      <span className="score__value">{formatAverage(score)}</span>
      {votes !== undefined && size === "lg" && <span className="score__votes">{formatCount(votes)} votes</span>}
    </span>
  );
}

/** Shown where our community score will sit, until enough people have rated (SPEC §6). */
export function CommunityScorePending({ size = "sm" }: { size?: Size }) {
  return <span className={cn("score score--tmdb", size === "lg" && "score--lg")}>Not enough ratings yet</span>;
}
