import { useId } from "react";
import { AppLink } from "../../../app/router/navigation";
import { useGenres } from "../queries";

/** Browse-by-genre shortcuts. Each chip is a link into Browse with that genre set. */
export function GenreChips() {
  const genres = useGenres();
  const headingId = useId();

  // Genres are a shortcut, not content: if they fail, the section steps aside.
  if (genres.isError) return null;

  return (
    <section aria-labelledby={headingId} className="genre-section">
      <h2 id={headingId}>Browse by genre</h2>
      <ul className="chip-row">
        {genres.isPending
          ? Array.from({ length: 10 }, (_, index) => <li aria-hidden="true" className="chip skeleton" key={index} />)
          : genres.data.map((genre) => (
            <li key={genre.id}>
              <AppLink className="chip" to={`/browse?genre=${genre.id}`}>{genre.name}</AppLink>
            </li>
          ))}
      </ul>
    </section>
  );
}
