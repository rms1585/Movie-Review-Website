import type { JSX } from "react";

// Types for the vendored React Bits MorphSlider (plain JavaScript), so the
// rest of the app keeps strict type checking where it uses it.

export type MorphSliderItem = {
  image: string;
  caption?: string;
};

export type MorphSliderProps = {
  items?: MorphSliderItem[];
  startIndex?: number;
  transition?: "melt" | "ripple" | "shear" | "swirl";
  duration?: number;
  ease?: string;
  intensity?: number;
  scale?: number;
  aberration?: number;
  drift?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  radius?: number;
  overlayColor?: string;
  showCaptions?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
  /** Added locally: called with the index of the slide now on screen. */
  onChange?: (index: number) => void;
};

declare function MorphSlider(props: MorphSliderProps): JSX.Element;
export default MorphSlider;
