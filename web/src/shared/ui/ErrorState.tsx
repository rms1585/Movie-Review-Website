import { RotateCw } from "lucide-react";

type ErrorStateProps = {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function ErrorState({ message = "Movie info is taking a break. Try again shortly.", onRetry, isRetrying = false }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <p>{message}</p>
      <button aria-disabled={isRetrying} className="button button--secondary button--sm" onClick={isRetrying ? undefined : onRetry} type="button">
        <RotateCw aria-hidden="true" className="icon" />
        {isRetrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
