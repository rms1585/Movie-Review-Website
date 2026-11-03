import { posterSource } from "../images";
import { FadeImage } from "./FadeImage";

type PosterProps = {
  title: string;
  path: string | null;
  /** The `sizes` hint for srcset: how wide this poster renders. */
  sizes: string;
  eager?: boolean;
};

/** A 2:3 poster whose box is reserved before the image arrives (design.md §4.4, §5). */
export function Poster({ title, path, sizes, eager = false }: PosterProps) {
  if (!path) {
    return (
      <div className="poster poster--missing">
        <span>{title}</span>
      </div>
    );
  }

  const { src, srcSet } = posterSource(path);
  return (
    <div className="poster">
      <FadeImage
        alt={`${title} poster`}
        fetchPriority={eager ? "high" : undefined}
        loading={eager ? "eager" : "lazy"}
        sizes={sizes}
        src={src}
        srcSet={srcSet}
      />
    </div>
  );
}
