import type { Config } from "tailwindcss";

// Every Tailwind name resolves to a token in src/app/styles.css, so a utility
// can never introduce a colour, size or radius that design.md doesn't define.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px"
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      bg: "var(--color-bg)",
      surface: "var(--color-surface)",
      "surface-raised": "var(--color-surface-raised)",
      border: "var(--color-border)",
      "border-strong": "var(--color-border-strong)",
      text: "var(--color-text)",
      muted: "var(--color-text-muted)",
      disabled: "var(--color-text-disabled)",
      accent: "var(--color-accent)",
      "on-accent": "var(--color-on-accent)",
      error: "var(--color-error)",
      warning: "var(--color-warning)"
    },
    fontFamily: {
      display: "var(--font-display)",
      body: "var(--font-body)"
    },
    spacing: {
      0: "0",
      1: "var(--space-1)",
      2: "var(--space-2)",
      3: "var(--space-3)",
      4: "var(--space-4)",
      5: "var(--space-5)",
      6: "var(--space-6)",
      8: "var(--space-8)",
      10: "var(--space-10)",
      12: "var(--space-12)",
      16: "var(--space-16)"
    },
    borderRadius: {
      none: "0",
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      pill: "var(--radius-pill)"
    },
    extend: {}
  },
  plugins: []
} satisfies Config;
