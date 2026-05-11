# Conway’s Game of Life — monorepo

This repository contains:

| Package | Stack | Description |
|---------|--------|-------------|
| **`backend/`** | .NET 10, ASP.NET Core, EF Core SQLite | REST API for boards, generations, and persistence. |
| **`frontend/`** | React 19, TypeScript, Vite 7 | UI to draw patterns, call the API, and visualize server-backed boards. |

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) (includes npm)

## Quick start

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

## Scripts (repository root)

| Script | Action |
|--------|--------|
| `npm run dev:backend` | Run the ASP.NET Core API. |
| `npm run dev:frontend` | Run the React app with hot reload. |
| `npm run build` | Release build for backend + production bundle for frontend. |
| `npm run test:backend` | Run xUnit tests. |

## Production / separate hosts

Set **`VITE_API_BASE_URL`** when building the frontend (e.g. `https://api.example.com`). Requests go to that origin; ensure the API **`Cors:AllowedOrigins`** in `backend/src/ConwayGameOfLife.Api/appsettings.json` includes your web origin.

## Documentation

- Backend API details, EF migrations, and architecture: [`backend/README.md`](backend/README.md)
