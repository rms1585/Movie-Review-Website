// TMDB serves images at fixed widths (design.md §5). srcset lists them so the
// browser picks the smallest one that fits, and phones never download
// desktop artwork. Image URLs carry no key, so they load straight from TMDB.
const IMAGE_BASE = "https://image.tmdb.org/t/p";

const posterWidths = [92, 154, 185, 342, 500, 780] as const;
const backdropWidths = [300, 780, 1280] as const;
const profileWidths = [45, 185] as const;

function srcSet(path: string, widths: readonly number[]): string {
  return widths.map((width) => `${IMAGE_BASE}/w${width}${path} ${width}w`).join(", ");
}

export type ImageSource = { src: string; srcSet: string };

function source(path: string, widths: readonly number[], fallbackWidth: number): ImageSource {
  return { src: `${IMAGE_BASE}/w${fallbackWidth}${path}`, srcSet: srcSet(path, widths) };
}

export function posterSource(path: string): ImageSource {
  return source(path, posterWidths, 342);
}

/** The smallest poster width, for thumbnails such as search suggestions. */
export function posterThumbSrc(path: string): string {
  return `${IMAGE_BASE}/w${posterWidths[0]}${path}`;
}

export function backdropSource(path: string): ImageSource {
  return source(path, backdropWidths, 1280);
}

export function profileSource(path: string): ImageSource {
  return source(path, profileWidths, 185);
}
