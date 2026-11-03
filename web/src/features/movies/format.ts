/** The year from TMDB's ISO date, or an empty string when the date is unknown. */
export function releaseYear(isoDate: string): string {
  return isoDate.slice(0, 4);
}

/** "16 September 2026". Parsed as a local date so no timezone shifts it a day. */
export function formatReleaseDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** "2h 14m", or "48m" for anything under an hour. */
export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

/** Averages always show one decimal (design.md §7.2). */
export function formatAverage(score: number): string {
  return score.toFixed(1);
}

/** Vote counts abbreviate above 999: 1.2k, 34k. */
export function formatCount(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, "") : Math.round(thousands)}k`;
}
