import react from "@vitejs/plugin-react";
import fs from "node:fs";
import { defineConfig, loadEnv } from "vite";

// VITE_BLOCKS_DEV_HOST: set this in .env to your project's real domain
// (from Project/Gets -> applications[].domain) to test OIDC login locally
// -- Blocks SSO sets a Secure, domain-scoped cookie that browsers refuse
// on plain http://localhost. Run `npm run cert` once that's set, then
// trust the generated .cert/dev-cert.pem. See README.md.
export default defineConfig(({ mode }) => {
  // Vite does not inject .env values into process.env for its own config
  // file -- loadEnv reads .env/.env.local explicitly (third arg "" loads
  // every key, not just VITE_-prefixed ones, though ours already are).
  const env = loadEnv(mode, process.cwd(), "");
  const domain = env.VITE_BLOCKS_DEV_HOST || undefined;
  const port = Number(env.VITE_BLOCKS_DEV_PORT || 5173);
  const https = fs.existsSync(".cert/dev-key.pem") && fs.existsSync(".cert/dev-cert.pem")
    ? { key: fs.readFileSync(".cert/dev-key.pem"), cert: fs.readFileSync(".cert/dev-cert.pem") }
    : undefined;

  const apiTarget = env.VITE_BLOCKS_API_URL || "https://api.seliseblocks.com";

  return {
    plugins: [react()],
    server: {
      // Dev-only escape hatch for the app's own origin rules. Blocks sends no
      // Access-Control-Allow-Origin to anything but the registered app
      // domain, so a dev server on localhost/127.0.0.1 has every API call
      // CORS-blocked. Proxying through the dev server makes those calls
      // same-origin from the browser's point of view; src/lib/blocks/config.ts
      // points apiUrl here whenever it detects the wrong origin, and only in
      // dev builds. `cookieDomainRewrite` below also lets IAM's session cookie
      // stick on this origin, so the hosted sign-in journey works here too --
      // provided this origin's /login/callback is registered on the OIDC client.
      proxy: {
        "/blocks-api": {
          changeOrigin: true,
          // IAM sets its session cookie with Domain=<the real app domain>, which
          // a browser refuses to store for a page served from localhost. Dropping
          // the Domain attribute makes it a host-only cookie for the dev origin,
          // so the hosted sign-in journey can actually establish a session here.
          // Browsers treat localhost/127.0.0.1 as trustworthy, so the cookie's
          // Secure flag survives plain http on those hosts.
          cookieDomainRewrite: { "*": "" },
          rewrite: (requestPath: string) => requestPath.replace(/^\/blocks-api/, ""),
          secure: true,
          target: apiTarget
        }
      },
      // Vite blocks unrecognized Host headers by default (DNS-rebinding
      // protection) -- without this, a custom domain 404s with "Blocked
      // request. This host is not allowed" even once hosts + cert are set.
      allowedHosts: domain ? [domain] : undefined,
      host: domain || "0.0.0.0",
      https,
      port,
      // Keep the port fixed: it's part of the registered OIDC redirect_uri.
      strictPort: true
    }
  };
});
