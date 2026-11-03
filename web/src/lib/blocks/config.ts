/** Dev-server proxy prefix. Must match the `proxy` key in vite.config.ts. */
const DEV_API_PROXY_PATH = "/blocks-api";

/**
 * Where Blocks API calls actually go.
 *
 * Normally the configured gateway. In a **dev build served from the wrong
 * origin** it is instead this dev server's own `/blocks-api`, which Vite
 * forwards on — otherwise every call is CORS-blocked and nothing works off
 * the registered domain. Never applied in a production build, where a wrong
 * origin is a misconfiguration to surface rather than paper over.
 */
function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_BLOCKS_API_URL as string;
  if (!import.meta.env.DEV) return configured;

  const appDomain = import.meta.env.VITE_BLOCKS_APP_DOMAIN as string;
  try {
    if (window.location.origin === new URL(appDomain).origin) return configured;
  } catch {
    return configured;
  }

  // Absolute, not a bare path: the SDK resolves every request against this
  // with `new URL(path, apiUrl + "/")`, which needs an absolute base.
  return `${window.location.origin}${DEV_API_PROXY_PATH}`;
}

export const blocksConfig = {
  apiUrl: resolveApiUrl(),
  appDomain: import.meta.env.VITE_BLOCKS_APP_DOMAIN as string,
  oidcUrl: import.meta.env.VITE_BLOCKS_OIDC_URL as string,
  oidcClientId: (import.meta.env.VITE_BLOCKS_OIDC_CLIENT_ID as string) || "",
  oidcScope: (import.meta.env.VITE_BLOCKS_OIDC_SCOPE as string) || "openid profile",
  // This project's tenant id -- sent as the x-blocks-key header on every
  // Blocks API call, and as tenant_id on the OIDC login request.
  xBlocksKey: import.meta.env.VITE_BLOCKS_X_BLOCKS_KEY as string
};

export function isBlocksConfigured(): boolean {
  return Boolean(blocksConfig.apiUrl && blocksConfig.xBlocksKey && blocksConfig.appDomain);
}

export function isLoginConfigured(): boolean {
  return Boolean(blocksConfig.apiUrl && blocksConfig.oidcUrl && blocksConfig.oidcClientId);
}

/**
 * True when the page is being served from somewhere other than the origin
 * registered with Blocks.
 *
 * Every Blocks API call is cross-origin from such a host, and the gateway
 * sends no `Access-Control-Allow-Origin` for it -- so the browser blocks the
 * response and `fetch` rejects with a bare "Failed to fetch". That message
 * says nothing about the actual cause, which is why this check exists.
 */
/** True when API calls are being routed through the dev proxy above. */
export function isUsingDevApiProxy(): boolean {
  return blocksConfig.apiUrl.endsWith(DEV_API_PROXY_PATH);
}

export function isServedFromAppDomain(): boolean {
  if (!blocksConfig.appDomain) return true;
  try {
    return window.location.origin === new URL(blocksConfig.appDomain).origin;
  } catch {
    return true;
  }
}

/** Explains a failed Blocks call, turning "Failed to fetch" into something actionable. */
export function describeBlocksFailure(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const looksLikeNetwork = error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(raw);

  if (looksLikeNetwork && !isServedFromAppDomain() && !isUsingDevApiProxy()) {
    return `The Blocks API refused a call from ${window.location.origin}. This app has to be served from ${blocksConfig.appDomain} — add it to your hosts file, run "npm run cert", and open it over HTTPS on that domain.`;
  }

  if (looksLikeNetwork) {
    return "Couldn't reach the Blocks API. Check your connection and try again.";
  }

  return raw || "Something went wrong. Try again.";
}
