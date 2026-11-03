import { useLayoutEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { cn } from "../../../lib/utils";

type FadeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "onLoad">;

type LoadState = "pending" | "fade" | "instant";

/**
 * Fades an image in once it has loaded (animation.md §4.5). Its box is sized
 * by the parent, so nothing shifts. An image the browser already has is
 * complete before first paint and shows at once, without the fade.
 */
export function FadeImage({ className, ...rest }: FadeImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<LoadState>("pending");

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setState("instant");
  }, []);

  return (
    <img
      className={cn("fade-image", state !== "pending" && "is-loaded", state === "instant" && "is-instant", className)}
      decoding="async"
      onLoad={() => setState((current) => (current === "pending" ? "fade" : current))}
      ref={imageRef}
      {...rest}
    />
  );
}
