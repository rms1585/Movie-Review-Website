import { Search } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { releaseYear } from "../../features/movies/format";
import { posterThumbSrc } from "../../features/movies/images";
import { useSuggestions } from "../../features/movies/queries";
import type { MovieSummary } from "../../features/movies/types";
import { distance, duration, exitFactor } from "../../lib/motion";
import { useNavigation } from "../router/navigation";

const DEBOUNCE_MS = 250;
const MIN_QUERY = 2;

function useDebounced(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** An ARIA 1.2 combobox: the input owns focus, arrow keys move a highlighted option. */
export function SearchBar() {
  const { navigate, path, search } = useNavigation();
  const inputId = useId();
  const listId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState(() => (path === "/search" ? new URLSearchParams(search).get("q") ?? "" : ""));
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounced = useDebounced(query.trim(), DEBOUNCE_MS);
  const suggestions = useSuggestions(debounced);
  const options = query.trim().length >= MIN_QUERY ? suggestions.data ?? [] : [];
  const showList = isOpen && options.length > 0;

  // Leaving a page through any route closes the list and resets highlight.
  useEffect(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, [path]);

  function openMovie(movie: MovieSummary) {
    setIsOpen(false);
    setQuery("");
    navigate(`/movie/${movie.id}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const active = options[activeIndex];
    if (showList && active) {
      openMovie(active);
      return;
    }
    const trimmed = query.trim();
    if (trimmed) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <form
      className="search"
      onBlur={(event) => {
        if (!formRef.current?.contains(event.relatedTarget as Node | null)) setIsOpen(false);
      }}
      onSubmit={handleSubmit}
      ref={formRef}
      role="search"
    >
      <label className="sr-only" htmlFor={inputId}>Search films</label>
      <Search aria-hidden="true" className="search__icon" />
      <input
        aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showList}
        autoComplete="off"
        className="search__input"
        id={inputId}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search films"
        role="combobox"
        type="search"
        value={query}
      />
      <AnimatePresence>
        {showList && (
          <m.ul
            animate={{ opacity: 1, y: 0 }}
            className="suggestions"
            exit={{ opacity: 0, transition: { duration: duration.fast * exitFactor } }}
            id={listId}
            initial={{ opacity: 0, y: -distance.xs }}
            role="listbox"
            transition={{ duration: duration.fast }}
          >
            {options.map((movie, index) => (
              <li
                aria-selected={index === activeIndex}
                className="suggestion"
                id={`${listId}-${index}`}
                key={movie.id}
                // mousedown, not click: it fires before the input's blur closes the list.
                onMouseDown={(event) => {
                  event.preventDefault();
                  openMovie(movie);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
              >
                <span className="suggestion__thumb">
                  {movie.posterPath && <img alt="" loading="lazy" src={posterThumbSrc(movie.posterPath)} />}
                </span>
                <span className="suggestion__title">{movie.title}</span>
                <span className="suggestion__year">{releaseYear(movie.releaseDate)}</span>
              </li>
            ))}
          </m.ul>
        )}
      </AnimatePresence>
      <p aria-live="polite" className="sr-only">
        {showList ? `${options.length} suggestions. Use the arrow keys to choose.` : ""}
      </p>
    </form>
  );
}
