import { useEffect, useSyncExternalStore } from "react";

// One short message at a time, announced politely and gone after a few
// seconds. It lives outside React state so a page can show one and then
// navigate away in the same breath.
const TOAST_MS = 5000;

let current: string | undefined;
const listeners = new Set<() => void>();

export function showToast(message: string): void {
  current = message;
  listeners.forEach((listener) => listener());
}

function dismiss(): void {
  current = undefined;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Rendered once by AppShell. */
export function ToastHost() {
  const message = useSyncExternalStore(subscribe, () => current);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(dismiss, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <div aria-live="polite" className="toast-region" role="status">
      {message && <p className="toast">{message}</p>}
    </div>
  );
}
