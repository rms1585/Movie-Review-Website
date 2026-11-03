import { useId } from "react";
import type { ReactNode } from "react";
import { AppLink } from "../../app/router/navigation";
import { useGenres } from "../movies/queries";
import type { BrowseFilters } from "../movies/types";
import { browseHref, decadeOptions, sortOptions } from "./browseFilters";

/**
 * Each option is a link to the filtered URL; the selected one is marked
 * aria-current and drawn with a lime border, never a lime fill (design.md §7.6).
 */
export function BrowseFiltersPanel({ filters }: { filters: BrowseFilters }) {
  const genres = useGenres();

  return (
    <nav aria-label="Filters" className="filters">
      <FilterGroup label="Sort by">
        {sortOptions.map((option) => (
          <FilterChip href={browseHref({ ...filters, sort: option.value })} key={option.value} selected={filters.sort === option.value}>
            {option.label}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Genre">
        <FilterChip href={browseHref({ ...filters, genreId: null })} selected={filters.genreId === null}>All genres</FilterChip>
        {genres.data?.map((genre) => (
          <FilterChip href={browseHref({ ...filters, genreId: genre.id })} key={genre.id} selected={filters.genreId === genre.id}>
            {genre.name}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup label="Decade">
        <FilterChip href={browseHref({ ...filters, decade: null })} selected={filters.decade === null}>Any year</FilterChip>
        {decadeOptions().map((decade) => (
          <FilterChip href={browseHref({ ...filters, decade })} key={decade} selected={filters.decade === decade}>
            {`${decade}s`}
          </FilterChip>
        ))}
      </FilterGroup>
    </nav>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  const labelId = useId();
  return (
    <div className="filters__group">
      <h2 className="filters__label" id={labelId}>{label}</h2>
      <ul aria-labelledby={labelId} className="chip-row filters__chips">{children}</ul>
    </div>
  );
}

function FilterChip({ href, selected, children }: { href: string; selected: boolean; children: ReactNode }) {
  return (
    <li>
      {/* matchExact against the full URL would never match (AppLink compares paths),
          so the selected state is set explicitly. */}
      <AppLink aria-current={selected ? "true" : undefined} className="chip" to={href}>{children}</AppLink>
    </li>
  );
}
