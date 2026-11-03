import { LoaderCircle } from "lucide-react";

/** A spinner with its label; the label alone carries the meaning when motion is reduced. */
export function StatusLine({ label }: { label: string }) {
  return (
    <p className="status-line" role="status">
      <LoaderCircle aria-hidden="true" className="spinner" />
      {label}
    </p>
  );
}
