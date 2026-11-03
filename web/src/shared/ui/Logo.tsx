import { cn } from "../../lib/utils";

// Paths copied from brand/limereel-symbol.svg. Inlined (not an <img>) so CSS
// sets the colour through currentColor, as brand/README.md requires.
export function LimereelSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" />
      <g fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d="M53.60 37.51 L53.60 17.20 A33 33 0 0 1 76.61 30.48 L59.02 40.64 A13 13 0 0 0 53.60 37.51 Z" />
        <path d="M62.62 46.87 L80.21 36.72 A33 33 0 0 1 80.21 63.28 L62.62 53.13 A13 13 0 0 0 62.62 46.87 Z" />
        <path d="M59.02 59.36 L76.61 69.52 A33 33 0 0 1 53.60 82.80 L53.60 62.49 A13 13 0 0 0 59.02 59.36 Z" />
        <path d="M46.40 62.49 L46.40 82.80 A33 33 0 0 1 23.39 69.52 L40.98 59.36 A13 13 0 0 0 46.40 62.49 Z" />
        <path d="M37.38 53.13 L19.79 63.28 A33 33 0 0 1 19.79 36.72 L37.38 46.87 A13 13 0 0 0 37.38 53.13 Z" />
        <path d="M40.98 40.64 L23.39 30.48 A33 33 0 0 1 46.40 17.20 L46.40 37.51 A13 13 0 0 0 40.98 40.64 Z" />
      </g>
      <circle cx="50" cy="50" r="5" fill="currentColor" />
    </svg>
  );
}

type LogoProps = {
  onNavigate: (path: string) => void;
  size?: "header" | "footer";
};

export function Logo({ onNavigate, size = "header" }: LogoProps) {
  return (
    <a
      aria-label="Limereel home"
      className={cn("logo", size === "footer" && "logo--footer")}
      href="/"
      onClick={(event) => {
        event.preventDefault();
        onNavigate("/");
      }}
    >
      <LimereelSymbol className="logo__symbol" />
      <span aria-hidden="true" className="logo__word">limereel</span>
    </a>
  );
}
