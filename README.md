# Conway's Game of Life API

Production-oriented ASP.NET Core REST API for [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life), with SQLite persistence via Entity Framework Core.

## Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) 10 (or adjust `TargetFramework` in each `.csproj` if you need 8/9 and matching EF Core packages).

## How to run

From the repository root:

```bash
dotnet restore
dotnet build
dotnet run --project src/ConwayGameOfLife.Api
```

On startup the API applies EF Core migrations (SQLite file from configuration).

- HTTP: see `src/ConwayGameOfLife.Api/Properties/launchSettings.json` for the configured URL (often `http://localhost:5xxx`).
- Swagger UI: `/swagger`

### Configuration (`appsettings.json`)

| Area | Purpose |
|------|--------|
| `ConnectionStrings:DefaultConnection` | SQLite connection string (default `Data Source=gameoflife.db`). |
| `Game` | Limits and defaults: `MaxRows`, `MaxColumns`, `MaxAdvanceSteps`, `MaxFinalStateAttempts`, `DefaultFinalStateMaxAttempts`. |

There are no connection strings or limits hardcoded in code; they come from configuration.

## API endpoints

| Method | Route | Description |
|--------|--------|-------------|
| `POST` | `/api/game/boards` | Upload a board (`cells` as jagged `bool[][]`). Returns `{ "id": "<guid>" }` with `201 Created` and `Location` header. |
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

| Project | Role |
|---------|------|
| `ConwayGameOfLife.Domain` | `Board`, `IGameEngine`, `GameEngine` (pure rules). |
| `ConwayGameOfLife.Application` | `IGameService`, orchestration, FluentValidation, options. |
| `ConwayGameOfLife.Infrastructure` | EF Core SQLite, `GameBoardEntity`, migrations, `IGameBoardRepository` implementation. |
| `ConwayGameOfLife.Api` | Controllers, Swagger, global exception handler, DI composition. |

## Tests

```bash
dotnet test
```

Uses **xUnit**, **FluentAssertions**, and **Moq** (service tests with a mocked repository).

## EF Core migrations

```bash
dotnet ef migrations add <Name> --project src/ConwayGameOfLife.Infrastructure --startup-project src/ConwayGameOfLife.Api
```

Requires the EF CLI (`dotnet tool install --global dotnet-ef`). The API project references `Microsoft.EntityFrameworkCore.Design` for tooling.
