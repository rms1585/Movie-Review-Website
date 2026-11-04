import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import type { Ref } from "react";

type PasswordFieldProps = {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  hint?: string;
  inputRef?: Ref<HTMLInputElement>;
  onInput?: () => void;
};

/**
 * A password input with a real show/hide button (SPEC §7.9). Paste is never
 * blocked, and autocomplete tells password managers what to fill.
 */
export function PasswordField({ label, name, autoComplete, error, hint, inputRef, onInput }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>{label}</label>
      {hint && <p className="field__hint" id={hintId}>{hint}</p>}
      <div className="field__password">
        <input
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          className="field__input"
          id={inputId}
          name={name}
          onInput={onInput}
          ref={inputRef}
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-controls={inputId}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="field__reveal"
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? <EyeOff aria-hidden="true" className="icon" /> : <Eye aria-hidden="true" className="icon" />}
        </button>
      </div>
      {error && <p className="field__error" id={errorId}>{error}</p>}
    </div>
  );
}
