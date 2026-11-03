import type { Transition } from "motion/react";

// Motion tokens from animation.md §3, mirrored from the CSS custom properties
// in src/app/styles.css: Motion needs numbers in seconds, CSS needs ms.
// Change a value in both places or neither.
export const duration = {
  instant: 0.1,
  fast: 0.15,
  base: 0.22,
  slow: 0.32,
  image: 0.4
} as const;

/** Exits run at about 70% of the entrance so they never block what comes next. */
export const exitFactor = 0.7;

export const ease = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1]
} as const;

export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 34 },
  smooth: { type: "spring", stiffness: 300, damping: 32 },
  gentle: { type: "spring", stiffness: 180, damping: 26 }
} satisfies Record<string, Transition>;

export const distance = {
  xs: 4,
  sm: 8,
  md: 16
} as const;
