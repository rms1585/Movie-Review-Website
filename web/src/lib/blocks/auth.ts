import { blocksClient } from "./client";
import { isJwtExpired } from "./jwt";

// Limereel signs people in on its own pages (SPEC §7.9) through IAM's
// password login, which returns tokens in the response body and also sets
// IAM's Secure, httpOnly session cookie. Tokens live in memory only: a
// reload drops them and the cookie re-establishes the session, so nothing
// an injected script could steal is ever written to browser storage.
// These keys are only ever read (a host-seeded marker) or cleared (values
// an earlier build of this app may have left behind).
const LEGACY_TOKEN_KEY = "blocks-app:access-token";
const REFRESH_TOKEN_KEY = "blocks-app:refresh-token";

let cachedAccessToken: string | undefined;
let cachedRefreshToken: string | undefined;
let refreshInFlight: Promise<string | undefined> | undefined;

// AuthProvider subscribes to this to learn the session died out-of-band (a
// refresh came back invalid_grant) so it can flip status to unauthenticated
// and let RequireAuth redirect to /login -- this module has no router access
// of its own to do that navigation directly.
const sessionExpiredListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired(): void {
  for (const listener of sessionExpiredListeners) listener();
}

function getAccessToken(): string | undefined {
  if (cachedAccessToken && !isJwtExpired(cachedAccessToken)) return cachedAccessToken;
  return undefined;
}

// Never written to storage by this app, deliberately: a refresh token is
// long-lived, and anything readable from JS is readable by an XSS payload.
//
// The stored value is still *read* as a fallback, for a host that can
// re-establish a session but cannot reach this module's variables -- a
// build running inside blocks-studio's preview is the case that matters:
// the session lives in an httpOnly cookie the page cannot see, and there
// is no reload-surviving cookie flow to fall back on, so the host seeds a
// non-secret marker here to say "ask for a refresh". Reading it is safe
// precisely because this app never puts a real token there.
function getRefreshToken(): string | undefined {
  if (cachedRefreshToken) return cachedRefreshToken;

  const seeded = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  return seeded ?? undefined;
}

function keepTokens(accessToken: string, refreshToken?: string): void {
  cachedAccessToken = accessToken;
  if (refreshToken) cachedRefreshToken = refreshToken;
}

function clearLocalTokens(): void {
  cachedAccessToken = undefined;
  cachedRefreshToken = undefined;
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  // This app never writes that key, but a host may have seeded it (see
  // getRefreshToken) and an earlier build of this app may have persisted a
  // real token there -- either way it must not survive a sign-out.
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Passed to createBlocksClient as the `accessToken` resolver: returns the
// cached token when it's still fresh, otherwise refreshes it through
// blocksClient.auth.oidc.refreshToken() -- concurrent callers share one
// in-flight refresh instead of racing duplicate requests. Resolves to
// undefined in the default cookie flow (nothing cached, nothing to
// refresh); the SDK still sends the session cookie on every request, so
// protected calls keep working without an Authorization header.
export async function getValidAccessToken(): Promise<string | undefined> {
  const current = getAccessToken();
  if (current) return current;
  return forceRefreshAccessToken();
}

// Passed to createBlocksClient as `onUnauthorized`: unlike getValidAccessToken,
// this skips the "is the cached token still fresh" check and always goes
// straight to refreshAccessToken() -- a 401 means the server already
// disagreed with our local judgment of freshness, so re-checking it would
// just resend the same rejected token. Still funnels through the same
// refreshInFlight guard, so a burst of concurrent 401s (and any proactive
// caller racing them) share one refresh call instead of firing one each.
export async function forceRefreshAccessToken(): Promise<string | undefined> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return undefined;

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken(refreshToken).finally(() => {
      refreshInFlight = undefined;
    });
  }

  return refreshInFlight;
}

async function refreshAccessToken(refreshToken: string): Promise<string | undefined> {
  let response: Awaited<ReturnType<typeof blocksClient.auth.oidc.refreshToken>>;
  try {
    response = await blocksClient.auth.oidc.refreshToken({ refreshToken });
  } catch {
    // A network/transport failure here says nothing about whether the
    // refresh token itself is still valid -- keep it cached so the next
    // attempt can still use it, instead of forcing a fresh sign-in over a
    // transient blip (e.g. the dev server restarting mid-session).
    return undefined;
  }

  const accessToken = response.access_token ?? response.accessToken;
  if (!accessToken) {
    // IAM answered but explicitly rejected the grant (e.g. invalid_grant --
    // the refresh token expired or was already rotated away) -- now it
    // really is dead, so this is a full sign-out, not just a cache clear.
    // Clear local state before the logout call so its own accessToken
    // lookup finds nothing to refresh and doesn't loop back into us.
    clearLocalTokens();
    await blocksClient.auth.logout({ refreshToken }).catch(() => undefined);
    notifySessionExpired();
    return undefined;
  }

  // The identity provider may not rotate the refresh token on every call --
  // keep the previous one instead of overwriting a working token with undefined.
  const nextRefreshToken = response.refresh_token ?? response.refreshToken ?? refreshToken;
  keepTokens(accessToken, nextRefreshToken);
  return accessToken;
}

// The session's source of truth is IAM, not a token this app can inspect --
// `GET /iam/v4/auth/me` (blocksClient.auth.userInfo()) validates the
// httpOnly session cookie (or bearer token, if one is cached) and returns
// its claims in one round trip. `iam.me()` is a different, heavier call --
// the full IAM user profile with roles/permissions -- and is used
// separately on the Profile page; it is not a substitute for this check.
export async function fetchSessionClaims(): Promise<Record<string, unknown> | undefined> {
  try {
    return await blocksClient.auth.userInfo();
  } catch {
    return undefined;
  }
}

/** Why a sign-in failed, in terms the login form can act on. */
export type LoginFailure = "invalid" | "not_activated" | "locked" | "mfa_required" | "other";

export type LoginResult = { ok: true } | { ok: false; reason: LoginFailure; message?: string };

/**
 * Email + password sign-in through IAM (`POST /iam/v4/auth/login`).
 *
 * Wrong email and wrong password come back as the same "invalid", so the
 * form can never reveal which one it was or whether the account exists.
 * Throws only when IAM couldn't be reached, so the caller can tell
 * "check your details" from "try again later".
 */
export async function loginWithPassword(params: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<LoginResult> {
  let response: Awaited<ReturnType<typeof blocksClient.auth.login>>;
  try {
    response = await blocksClient.auth.login({
      password: params.password,
      rememberMe: params.rememberMe,
      username: params.email.trim()
    });
  } catch (caught) {
    // A rejected credential arrives as a 401 carrying an OAuth error envelope,
    // which the SDK attaches to the thrown error as `body`. Anything without
    // that envelope is a transport failure and is rethrown untouched.
    const body = loginErrorBody(caught);
    if (!body?.error) throw caught;
    return classifyLoginError(body.error, body.error_description);
  }

  // IAM can also answer 200 with the same envelope, so a thrown error is not
  // the only failure mode.
  if (response.error) return classifyLoginError(response.error, response.error_description);

  const accessToken = response.access_token ?? response.accessToken;
  if (accessToken) {
    keepTokens(accessToken, response.refresh_token ?? response.refreshToken);
    return { ok: true };
  }

  // No token and no error: a cookie-only session, which userInfo() confirms.
  return (await fetchSessionClaims()) ? { ok: true } : { ok: false, reason: "other" };
}

function loginErrorBody(error: unknown): { error?: string; error_description?: string } | undefined {
  const body = (error as { body?: unknown } | null)?.body;
  return body && typeof body === "object" ? (body as { error?: string; error_description?: string }) : undefined;
}

/** IAM's OAuth error codes, sorted into what the form shows. */
function classifyLoginError(code: string, description?: string): LoginResult {
  switch (code) {
    case "invalid_grant":
    case "invalid_username_password":
    case "invalid_username_or_password":
      return { ok: false, reason: "invalid" };
    case "account_not_verified":
    case "user_not_active":
      return { ok: false, reason: "not_activated" };
    case "account_locked":
      return { ok: false, reason: "locked", message: description };
    case "mfa_required":
      return { ok: false, reason: "mfa_required" };
    default:
      return { ok: false, reason: "other", message: description };
  }
}

export async function logout(): Promise<void> {
  // Ask IAM to end the session (clears the httpOnly cookie server-side)
  // before dropping any locally cached bearer token; best-effort so a
  // network failure never blocks the user from leaving a protected page.
  await blocksClient.auth.logout({ refreshToken: getRefreshToken() }).catch(() => undefined);
  clearLocalTokens();
}
