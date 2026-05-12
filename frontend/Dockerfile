# Build context must be the monorepo root (npm workspaces + Vite resolve to parent node_modules).
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Full workspace install so optional native packages (e.g. Rolldown) match the build OS/arch.
RUN npm ci

COPY frontend ./frontend

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# npm lockfiles generated on macOS may not materialize Rolldown's Linux optional native deps in CI/Docker.
RUN set -eux; \
  arch="$(uname -m)"; \
  case "$arch" in \
    aarch64) \
      npm install @rolldown/binding-linux-arm64-gnu@1.0.0 lightningcss-linux-arm64-gnu -w frontend --no-save ;; \
    x86_64) \
      npm install @rolldown/binding-linux-x64-gnu@1.0.0 lightningcss-linux-x64-gnu -w frontend --no-save ;; \
    *) echo "Unsupported arch for Vite native deps in Docker: $arch" >&2; exit 1 ;; \
  esac

WORKDIR /app
RUN npm run build --workspace=frontend

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
