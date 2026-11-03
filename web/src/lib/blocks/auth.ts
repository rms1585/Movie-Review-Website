import { blocksClient } from "./client";
import { blocksConfig } from "./config";
import { isJwtExpired } from "./jwt";

// IAM's hosted IdP flow sets the session as a Secure, httpOnly cookie by
// default -- this app never sees that token and must not try to. Bearer
// tokens below are only populated when a tenant's OIDC config explicitly
// opts into returning tokens in the response body instead of a cookie; in
// the default cookie flow every function below simply no-ops around them.
const TOKEN_KEY = "blocks-app:access-token";
const REFRESH_TOKEN_KEY = "blocks-app:refresh-token";
const RETURN_KEY = "blocks-app:oidc-return-to";

export type CallbackResult = { ok: true; returnTo: string } | { ok: false; message: string };

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

  const stored = sessionStorage.getItem(TOKEN_KEY);
  if (stored && !isJwtExpired(stored)) {
    cachedAccessToken = stored;
    return stored;
  }

  return undefined;
}

// Never written to storage by this app, deliberately: a refresh token is
// long-lived, and anything readable from JS is readable by an XSS payload.
// The access token is short-lived, so that one is persisted to keep a
// reload from bouncing the user, and IAM's httpOnly session cookie
// re-establishes the session once it expires.
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

function persistTokens(accessToken: string, refreshToken?: string): void {
  cachedAccessToken = accessToken;
  sessionStorage.setItem(TOKEN_KEY, accessToken);

  if (refreshToken) cachedRefreshToken = refreshToken;
}

function clearLocalTokens(): void {
  cachedAccessToken = undefined;
  cachedRefreshToken = undefined;
  sessionStorage.removeItem(TOKEN_KEY);
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
  persistTokens(accessToken, nextRefreshToken);
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

/**
 * Direct email + password sign-in through IAM's AuthController
 * (`POST /iam/v4/auth/login`), for the app's own login form.
 *
 * Unlike the hosted IdP flow this returns the tokens in the response body and
 * the SDK deliberately does not store them, so persisting them here is what
 * makes the session exist at all. IAM also sets its session cookie on this
 * same response (the HTTP client sends `credentials: "include"`), which is
 * what carries the session across a reload once the short-lived access token
 * in sessionStorage expires.
 */
export async function loginWithPassword(params: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<void> {
  let response: Awaited<ReturnType<typeof blocksClient.auth.login>>;
  try {
    response = await blocksClient.auth.login({
      password: params.password,
      rememberMe: params.rememberMe ?? true,
      username: params.email.trim()
    });
  } catch (caught) {
    // A rejected credential arrives as a 401 carrying an OAuth error envelope,
    // which the SDK attaches to the thrown error as `body`. Anything without
    // that envelope is a transport failure and is rethrown untouched, so the
    // caller can still tell "wrong password" from "the API is unreachable".
    const code = loginErrorCode(caught);
    if (!code) throw caught;
    throw new Error(describeLoginError(code, loginErrorDescription(caught)));
  }

  // IAM can also answer 200 with the same envelope, so a thrown error is not
  // the only failure mode.
  if (response.error) {
    throw new Error(describeLoginError(response.error, response.error_description));
  }

  const accessToken = response.access_token ?? response.accessToken;
  if (accessToken) {
    persistTokens(accessToken, response.refresh_token ?? response.refreshToken);
    return;
  }

  // No token and no error: the only remaining success shape is a cookie-only
  // session, which userInfo() will confirm. Treating this as a failure would
  // reject a login that actually worked.
  const claims = await fetchSessionClaims();
  if (!claims) {
    throw new Error("Sign-in didn't return a session. Check your email and password, then try again.");
  }
}

function loginErrorBody(error: unknown): { error?: string; error_description?: string } | undefined {
  const body = (error as { body?: unknown } | null)?.body;
  return body && typeof body === "object" ? (body as { error?: string; error_description?: string }) : undefined;
}

function loginErrorCode(error: unknown): string {
  const code = loginErrorBody(error)?.error;
  return typeof code === "string" ? code : "";
}

function loginErrorDescription(error: unknown): string | undefined {
  return loginErrorBody(error)?.error_description;
}

/** IAM's OAuth error codes are not written for end users. */
function describeLoginError(code: string, description?: string): string {
  switch (code) {
    case "invalid_grant":
    case "invalid_username_password":
    case "invalid_username_or_password":
      return "That email and password don't match an account.";
    case "account_locked":
      return "This account is locked after too many failed attempts. Try again shortly, or reset your password.";
    case "account_not_verified":
    case "user_not_active":
      return "This account hasn't been activated yet. Check your inbox for the activation link.";
    case "mfa_required":
      return "This account needs a second factor, which this app doesn't collect yet. Use \"Continue with Blocks\" instead.";
    default:
      return description || "Sign-in failed. Check your email and password, then try again.";
  }
}

/**
 * Sends the password-recovery mail. IAM owns the reset link and the form
 * behind it, so this app only triggers it.
 *
 * Resolves the same way whether or not the address has an account -- telling
 * an anonymous caller which emails are registered is an account-enumeration
 * leak, and IAM's own response is deliberately vague for the same reason.
 */
export async function recoverPassword(email: string): Promise<void> {
  await blocksClient.auth.recover({ email: email.trim() });
}

/**
 * The callback URL this app is actually reachable at right now.
 *
 * IAM matches `redirect_uri` byte-for-byte against the OIDC client's
 * registered list, including scheme and port, so this is also the exact
 * string to register when a new origin needs to support hosted sign-in.
 */
export function currentCallbackUri(): string {
  return `${window.location.origin}/login/callback`;
}

/**
 * Starts the hosted Blocks sign-in journey: the browser leaves for Blocks'
 * own login page and comes back to `/login/callback` with a code.
 *
 * `redirectUri` is sent explicitly rather than left to the SDK default so the
 * journey follows whichever origin the app is served from, instead of being
 * pinned to the one baked into `.env` at build time.
 */
export async function startLogin(returnTo?: string): Promise<void> {
  if (!blocksConfig.oidcClientId) {
    throw new Error("Blocks sign-in is not configured. Set VITE_BLOCKS_OIDC_CLIENT_ID in .env.");
  }

  // Survives the round trip to Blocks and back, since the app is fully
  // unloaded while the user is on IAM's pages.
  sessionStorage.setItem(RETURN_KEY, returnTo || "/");

  try {
    await blocksClient.auth.idp.redirectToProvider({ redirectUri: currentCallbackUri() });
  } catch (caught) {
    sessionStorage.removeItem(RETURN_KEY);
    throw new Error(describeIdpFailure(caught));
  }
}

/**
 * An unregistered `redirect_uri` is the overwhelmingly common failure here,
 * and IAM reports it in a way that does not say which URI to register.
 */
function describeIdpFailure(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");

  if (/redirect_uri|redirect uri|invalid_request|unauthorized_client/i.test(raw)) {
    return `Blocks rejected the return address for this origin. Register ${currentCallbackUri()} as a redirect URI on OIDC client ${blocksConfig.oidcClientId}, then try again.`;
  }

  return raw || "Couldn't start Blocks sign-in. Try again.";
}

export async function completeLogin(callbackUrl: string): Promise<CallbackResult> {
  const returnTo = sessionStorage.getItem(RETURN_KEY) || "/";

  sessionStorage.removeItem(RETURN_KEY);

  let data: Awaited<ReturnType<typeof blocksClient.auth.idp.callback>>;
  try {
    data = await blocksClient.auth.idp.callback(callbackUrl);
  } catch (caught) {
    // Without this the callback page waits on a promise that never settles
    // and shows its spinner forever.
    return { message: describeIdpFailure(caught), ok: false };
  }

  if (data.error) {
    return { message: data.error_description || data.error, ok: false };
  }

  // A non-default OIDC config returns the tokens in the body; cache them and
  // the session is established.
  const accessToken = data.access_token ?? data.accessToken;
  if (accessToken) {
    persistTokens(accessToken, data.refresh_token ?? data.refreshToken);
    return { ok: true, returnTo };
  }

  // Otherwise IAM set the session as a cookie on this same response. That is
  // the normal, successful path -- but only if the browser actually kept the
  // cookie, which it will not when the app is served from an origin the
  // cookie's domain does not cover. Confirming with userInfo() here turns
  // that into one clear message, instead of reporting success and then
  // bouncing silently back to /login when the guard finds no session.
  const claims = await fetchSessionClaims();
  if (claims) return { ok: true, returnTo };

  return {
    message: `Blocks signed you in, but the session didn't stick on ${window.location.origin}. The session cookie is scoped to ${blocksConfig.appDomain}, so this journey needs the app served from that domain. Email sign-in works here.`,
    ok: false
  };
}

export async function logout(): Promise<void> {
  // Ask IAM to end the session (clears the httpOnly cookie server-side)
  // before dropping any locally cached bearer token; best-effort so a
  // network failure never blocks the user from leaving a protected page.
  await blocksClient.auth.logout({ refreshToken: getRefreshToken() }).catch(() => undefined);
  clearLocalTokens();
}
