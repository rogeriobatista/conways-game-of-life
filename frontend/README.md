# Frontend (React + TypeScript + Vite)

Conway’s Game of Life UI for the monorepo API: realm editor, life controls, **Meteor shower** (falling patterns), and **Meteor strike** (shooter mini-game).

## Documentation map

| Topic | Where |
|--------|--------|
| Monorepo overview, Docker Compose, npm scripts | [Root `README.md`](../README.md) |
| REST API, SQLite, migrations | [`backend/README.md`](../backend/README.md) |

## Prerequisites

- **Node.js 20+** and npm (workspace install is driven from the repo root).
- Running **backend** locally on port **5021** (or set `VITE_API_BASE_URL` — see below).

## Local development

From the **repository root** (npm workspaces):

```bash
npm install          # once, at repo root
npm run dev:frontend
```

Vite defaults to **port 5173** and **proxies** `/api` to `http://127.0.0.1:5021` (see `vite.config.ts`). Start the API in another terminal: `npm run dev:backend`.

### Build (static files)

```bash
npm run build:frontend
```

Output: `frontend/dist/`.

### Environment variables

| Variable | When to set |
|----------|-------------|
| `VITE_API_BASE_URL` | Production build when the API is on another origin (e.g. `https://api.example.com`). Must **not** include a trailing slash. If unset, the app uses **relative** URLs (`/api/...`) — correct when the UI is served from the same host as the API or when a reverse proxy forwards `/api`. |

TypeScript typings: `src/vite-env.d.ts`.

## Docker

The **`frontend/Dockerfile`** is designed to be built with the **repository root as context** (so `package-lock.json` and the `frontend` workspace match local installs). Docker Compose at the repo root already does this.

The image is **multi-stage**:

1. **Node (bookworm-slim)** — `npm ci` at the monorepo root, then extra installs for **Linux native optional dependencies** used by Vite 8 (Rolldown + Lightning CSS) when the lockfile was produced on macOS.
2. **nginx** — serves `dist/` and proxies `/api` and `/swagger` to the `api` service (see `nginx.conf`).

Build manually from the repo root:

```bash
docker build -f frontend/Dockerfile -t conway-game-of-life-web .
```

Optional build arg (only if the UI must call a different API origin instead of same-host `/api`):

```bash
docker build -f frontend/Dockerfile --build-arg VITE_API_BASE_URL=https://api.example.com -t conway-game-of-life-web .
```

## Lint

```bash
cd frontend && npm run lint
```
