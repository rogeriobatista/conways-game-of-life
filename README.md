# Conway’s Game of Life — monorepo

This repository contains:

| Package | Stack | Description |
|---------|--------|-------------|
| **`backend/`** | .NET 10, ASP.NET Core, EF Core SQLite | REST API for boards, generations, and persistence. |
| **`frontend/`** | React 19, TypeScript, Vite 8 | UI to draw patterns, call the API, visualize boards, **clear** (reset grid) or **delete** boards, and arcade side modes. |

## Documentation

| Document | Contents |
|----------|----------|
| **[`backend/README.md`](backend/README.md)** | API routes, configuration, architecture, tests, EF migrations, **Docker (API image)**. |
| **[`frontend/README.md`](frontend/README.md)** | Dev server, build, environment variables, **Docker (nginx + SPA)**. |
| **This file** | Monorepo overview, quick start, Docker Compose for full stack, npm scripts. |

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) (includes npm) for local frontend and workspace installs
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2 — optional, for containerized run

## Quick start (local)

**1. API (port 5021 by default)**

```bash
npm run dev:backend
```

Or from `backend/`: `dotnet run --project src/ConwayGameOfLife.Api --launch-profile http`

**2. Web UI (Vite dev server, port 5173)**

In another terminal:

```bash
npm run dev:frontend
```

The Vite dev server **proxies** `/api` to `http://127.0.0.1:5021`, so the browser can call the API without CORS issues during local development.

**Arcade (keyboard):** **Meteor shower** and **Meteor strike** are available from the drawer or the home screen. See [`frontend/README.md`](frontend/README.md) for build-time options.

## Docker Compose (API + UI)

From the **repository root**:

```bash
docker compose up --build
```

- **App + proxied API:** [http://localhost:8080](http://localhost:8080) — nginx serves the React build and proxies `/api` and `/swagger` to the API container.
- **API only (direct):** [http://localhost:5021/swagger](http://localhost:5021/swagger)

SQLite data lives in the named volume `conway_sqlite` (mounted at `/data` in the API container). Remove it with:

```bash
docker compose down -v
```

Equivalent npm scripts: `npm run docker:up` / `npm run docker:down`.

## Scripts (repository root)

| Script | Action |
|--------|--------|
| `npm run dev:backend` | Run the ASP.NET Core API. |
| `npm run dev:frontend` | Run the React app with hot reload. |
| `npm run build` | Release build for backend + production bundle for frontend. |
| `npm run test:backend` | Run xUnit tests. |
| `npm run docker:up` | `docker compose up --build`. |
| `npm run docker:down` | `docker compose down`. |

## Production / separate hosts

When the UI and API are on **different origins**, set **`VITE_API_BASE_URL`** at **frontend build time** (e.g. `https://api.example.com`). Ensure the API **`Cors:AllowedOrigins`** in `backend/src/ConwayGameOfLife.Api/appsettings.json` includes your web origin.

With **Docker Compose** as documented above, the UI uses **relative** `/api` URLs and does not need `VITE_API_BASE_URL`.
