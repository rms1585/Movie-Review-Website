import { m } from "motion/react";
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { spring } from "../../lib/motion";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type RatingControlProps = {
  value: number | null;
  onChange: (score: number, source: "pointer" | "keyboard") => void;
  labelledBy: string;
  disabled?: boolean;
};

/**
 * Ten score buttons as a radio group (design.md §7.7): arrow keys move the
 * selection, 1-9 and 0 (for 10) pick directly, and only the selected score is
 * a tab stop.
 */
export function RatingControl({ value, onChange, labelledBy, disabled = false }: RatingControlProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusIndex = value === null ? 0 : value - 1;

  function select(score: number, source: "pointer" | "keyboard") {
    if (disabled) return;
    onChange(score, source);
    buttonRefs.current[score - 1]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = value ?? 0;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      select(Math.min(10, current + 1), "keyboard");
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      select(Math.max(1, current - 1), "keyboard");
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      select(event.key === "Home" ? 1 : 10, "keyboard");
    } else if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      select(event.key === "0" ? 10 : Number(event.key), "keyboard");
    }
  }

  return (
    <div aria-disabled={disabled} aria-labelledby={labelledBy} className="rating-control" onKeyDown={handleKeyDown} role="radiogroup">
      {SCORES.map((score, index) => {
        const isSelected = value === score;
        return (
          <m.button
            animate={isSelected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            aria-checked={isSelected}
            aria-label={`${score} out of 10`}
            className="rating-control__score"
            key={score}
            onClick={() => select(score, "pointer")}
            ref={(node: HTMLButtonElement | null) => {
              buttonRefs.current[index] = node;
            }}
            role="radio"
            tabIndex={index === focusIndex ? 0 : -1}
            transition={spring.snappy}
            type="button"
          >
            {score}
          </m.button>
        );
      })}
    </div>
  );
}
