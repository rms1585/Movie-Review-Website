import type { MovieSummary } from "../types";
import { PosterCard, PosterCardSkeleton } from "./PosterCard";

const GRID_POSTER_SIZES = "(min-width: 1024px) 200px, (min-width: 768px) 25vw, 33vw";

/** Browse and search results: 3 columns on phones, 4 from md, 5 from lg (design.md §4.2). */
export function PosterGrid({ movies }: { movies: MovieSummary[] }) {
  return (
    <ul className="poster-grid">
      {movies.map((movie) => (
        <li key={movie.id}><PosterCard movie={movie} sizes={GRID_POSTER_SIZES} /></li>
      ))}
    </ul>
  );
}

export function PosterGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <ul aria-busy="true" className="poster-grid">
      {Array.from({ length: count }, (_, index) => <li key={index}><PosterCardSkeleton /></li>)}
    </ul>
  );
}
