# Conway's Game of Life API

Production-oriented ASP.NET Core REST API for [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life), with SQLite persistence via Entity Framework Core.

## Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) 10 (or adjust `TargetFramework` in each `.csproj` if you need 8/9 and matching EF Core packages).
- [Docker](https://docs.docker.com/get-docker/) — optional; see **Docker** below.

## How to run

From the **`backend/`** directory (or prefix paths with `backend/` from the monorepo root):

```bash
cd backend
dotnet restore
dotnet build
dotnet run --project src/ConwayGameOfLife.Api --launch-profile http
```

On startup the API applies EF Core migrations (SQLite file is created next to the API project unless you override the connection string).

- HTTP: see `src/ConwayGameOfLife.Api/Properties/launchSettings.json` (default `http://localhost:5021`).
- Swagger UI: `/swagger`

## Docker

Build and run **only the API** (SQLite file is created under the container working directory unless you override `ConnectionStrings__DefaultConnection`):

```bash
cd backend
docker build -t conway-game-of-life-api .
docker run --rm -p 5021:8080 \
  -e ConnectionStrings__DefaultConnection="Data Source=/tmp/gameoflife.db" \
  -e Cors__AllowedOrigins__0="http://localhost:5173" \
  conway-game-of-life-api
```

The published image listens on **port 8080** inside the container (`ASPNETCORE_URLS`); map it as needed (e.g. `-p 5021:8080`).

For **API + React UI** together, use **Docker Compose from the monorepo root** — see the root [`README.md`](../README.md#docker-compose-api--ui).

### Configuration (`appsettings.json`)

| Area | Purpose |
|------|--------|
| `ConnectionStrings:DefaultConnection` | SQLite connection string (default `Data Source=gameoflife.db`). |
| `Game` | Limits and defaults: `MaxRows`, `MaxColumns`, `MaxAdvanceSteps`, `MaxFinalStateAttempts`, `DefaultFinalStateMaxAttempts`, `DefaultLeaderboardTop`. |
| `Cors:AllowedOrigins` | Origins allowed for browser cross-origin calls (Vite dev server URLs by default). |

There are no connection strings or limits hardcoded in code; they come from configuration.

## API endpoints

| Method | Route | Description |
|--------|--------|-------------|
| `GET` | `/api/game/boards` | Lists all registered boards: `id`, `rows`, `columns`, `updatedAtUtc` (ISO UTC). Most recently updated first. Omits cell data. |
| `POST` | `/api/game/boards` | Upload a board (`cells` as jagged `bool[][]`). Returns `{ "id": "<guid>" }` with `201 Created` and `Location` header. |
| `GET` | `/api/game/boards/{id}` | Returns the current persisted grid (no evolution). |
| `PUT` | `/api/game/boards/{id}` | Replaces the entire grid (`cells` body); keeps the same id. |
| `DELETE` | `/api/game/boards/{id}` | Deletes the board permanently (`204 No Content`). |
| `GET` | `/api/game/boards/{id}/next` | Computes the next generation, **persists** it, returns current state. |
| `GET` | `/api/game/boards/{id}/advance/{steps}` | Advances `steps` generations, persists result. |
| `GET` | `/api/game/boards/{id}/final?maxAttempts=` | Advances until a **stable** generation or fails with `400` if not reached within `maxAttempts`. If `maxAttempts` is omitted, `Game:DefaultFinalStateMaxAttempts` is used. |

JSON error bodies look like `{ "code": "...", "message": "..." }`.

## Assumptions

1. **Finite grid; edges are dead.** Cells outside the rectangle are treated as dead (no toroidal wrap).
2. **Stored board moves forward.** Each `next`, `advance`, and successful `final` call updates the saved state so later calls continue from the latest generation.
3. **Stable final state** means `next(generation) == generation` (still lifes). Patterns that oscillate (e.g. blinker) never satisfy this and typically return `400` with code `final_state_not_reached` once `maxAttempts` is exceeded.
4. **Failed `final` still advances persistence.** If stabilization fails within `maxAttempts`, the stored board is left at the state reached after those attempts (same as having called `advance` that many times).

## Architecture

Projects are split by layer; **namespaces follow folders** so types are easy to locate.

| Project | Role | Main folders |
|---------|------|----------------|
| `ConwayGameOfLife.Domain` | Pure game rules (no I/O). | `Entities/` (`Board`), `Simulation/` (`IGameEngine`, `GameEngine`). |
| `ConwayGameOfLife.Application` | Use cases, validation, ports. | `Services/` (`IGameService`, `GameService`, meteor scores), `Commands/`, `Responses/`, `Validators/`, `Exceptions/`, `Options/`, `Persistence/` (repository contracts + `Records/`), `Composition/` (`DependencyInjection`). |
| `ConwayGameOfLife.Infrastructure` | EF Core SQLite, migrations. | `Persistence/` (`GameDbContext`, `Entities/`, `Repositories/`), `Migrations/`. |
| `ConwayGameOfLife.Api` | HTTP surface, Swagger, Serilog. | `Controllers/`, `ExceptionHandling/`. |
| `ConwayGameOfLife.Tests` | xUnit tests. | `Application/`, `Domain/`, `Fixtures/` (`TestBoards`). |

## Tests

```bash
cd backend && dotnet test
```

Uses **xUnit**, **FluentAssertions**, and **Moq** (service tests with a mocked repository).

## EF Core migrations

```bash
cd backend
dotnet ef migrations add <Name> --project src/ConwayGameOfLife.Infrastructure --startup-project src/ConwayGameOfLife.Api
```

Requires the EF CLI (`dotnet tool install --global dotnet-ef`). The API project references `Microsoft.EntityFrameworkCore.Design` for tooling.
