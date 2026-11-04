/**
 * Where to go after signing in. Only a path on this site is accepted, so a
 * crafted link like /login?returnTo=https://evil.example can't send someone
 * off-site after they type their password (SPEC §7.9).
 */
export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

/** `/login?returnTo=…` style link that carries the current place along. */
export function withReturnTo(path: string, returnTo: string): string {
  const target = safeReturnTo(returnTo);
  return target === "/" ? path : `${path}?returnTo=${encodeURIComponent(target)}`;
}

// Sign-up leaves the page for an email, often opened in a new tab, so the
// place to come back to is kept across tabs. It is only ever a path on this
// site, never anything personal.
const PENDING_KEY = "limereel:after-activation";

export function rememberAfterActivation(returnTo: string): void {
  try {
    localStorage.setItem(PENDING_KEY, safeReturnTo(returnTo));
  } catch {
    // Storage can be blocked (private mode); the person just lands on Home.
  }
}

/** Reads and forgets the saved place, so it's used once. */
export function takeAfterActivation(): string {
  try {
    const saved = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    return safeReturnTo(saved);
  } catch {
    return "/";
  }
}
