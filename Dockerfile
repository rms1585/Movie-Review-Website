# Blocks Release builds from the repo root; the app itself lives in web/.
FROM node:22-alpine AS builder

WORKDIR /app

COPY web/package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY web/ .

# Vite reads the client-safe settings for this mode from web/.env.<mode>
# (web/.env.dev for the dev environment). Build args, when the pipeline
# passes them, take precedence.
ARG ci_build=dev
ARG VITE_BLOCKS_API_URL
ARG VITE_BLOCKS_X_BLOCKS_KEY
ARG VITE_BLOCKS_APP_DOMAIN
ARG VITE_BLOCKS_OIDC_URL
ARG VITE_BLOCKS_OIDC_CLIENT_ID
ARG VITE_BLOCKS_OIDC_SCOPE

RUN for name in VITE_BLOCKS_API_URL VITE_BLOCKS_X_BLOCKS_KEY VITE_BLOCKS_APP_DOMAIN VITE_BLOCKS_OIDC_URL VITE_BLOCKS_OIDC_CLIENT_ID VITE_BLOCKS_OIDC_SCOPE; do \
      eval "value=\${$name}"; [ -z "$value" ] && unset "$name"; \
    done; \
    NODE_OPTIONS="--max-old-space-size=4096" npx vite build --mode "${ci_build}" \
  && node scripts/write-release-env.mjs "${ci_build}"

FROM nginxinc/nginx-unprivileged:1.29-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
