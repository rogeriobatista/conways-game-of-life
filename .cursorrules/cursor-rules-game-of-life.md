# Cursor Rules for Conway's Game of Life API Challenge

You are an expert C# / .NET developer. Your goal is to implement a production-ready API for Conway's Game of Life, following SOLID principles, Clean Architecture, and the specific requirements of the Nortal/Client code challenge.

## Project Context
- **Framework:** .NET 8 or 9 (Latest)
- **Primary Language:** C#
- **Domain:** Conway's Game of Life (Grid-based cellular automaton)

## Functional Requirements
1. **Upload Board:** POST `/api/game/boards` - Returns a unique ID.
2. **Next State:** GET `/api/game/boards/{id}/next` - Returns the next generation.
3. **Advance X States:** GET `/api/game/boards/{id}/advance/{steps}` - Returns state after X steps.
4. **Final State:** GET `/api/game/boards/{id}/final?maxAttempts=X` - Returns conclusion or error if not reached within X attempts.

## Non-Functional Requirements
- **Persistence:** Must survive application crashes/restarts. Use SQLite with Entity Framework Core or a file-based provider.
- **Production Ready:** Logging, Error Handling, Input Validation, Dependency Injection.
- **Async/Await:** All I/O and DB operations must be asynchronous.

## Technical Strategy

### 1. Domain Logic (Game of Life Rules)
- Any live cell with 2 or 3 live neighbors survives.
- Any dead cell with exactly 3 live neighbors becomes a live cell.
- All other live cells die; all other dead cells stay dead.
- Implement this logic in a dedicated `IGameEngine` or `Board` domain model to ensure it is isolated from the API layer.

### 2. Architecture Layers
- **Web API:** Controllers, DTOs, and Middleware (Exception handling).
- **Application/Services:** Business logic orchestration (`IGameService`).
- **Domain:** Core models and logic.
- **Infrastructure:** Persistence logic (EF Core context, Migrations).

### 3. Error Handling & Validation
- Use a Global Exception Filter or Middleware to catch errors and return consistent JSON responses.
- Validate board dimensions and state (e.g., ensure it's a valid grid) using FluentValidation or DataAnnotations.
- For Requirement #4, if a board doesn't stabilize within `maxAttempts`, return a `400 Bad Request` or specific error DTO.

### 4. Persistence Details
- Use SQLite for simplicity and portability in a code challenge.
- Ensure the DB schema stores the board state as a serializable format (JSON string or byte array).

### 5. Testing Strategy
- **Unit Tests:** xUnit + FluentAssertions. Focus on the `GameEngine` logic and `GameService`.
- **Mocking:** Use Moq or NSubstitute for DB/Service abstractions.

## Implementation Instructions for Cursor
1. **Initialize Project:** Create a Web API project and a separate Unit Test project.
2. **Apply Standards:**
    - Use File-Scoped Namespaces.
    - Use Primary Constructors where appropriate.
    - Follow Microsoft C# Coding Conventions.
3. **Documentation:** Generate a `README.md` covering:
    - How to run the project.
    - Assumptions made (e.g., board boundary conditions: wrap-around vs. dead-ends).
    - Architecture decisions.

## Code Quality Checklist
- [ ] SOLID principles followed.
- [ ] No hardcoded strings; use `appsettings.json`.
- [ ] Meaningful logging with `ILogger`.
- [ ] High test coverage for domain logic.
- [ ] Swagger/OpenAPI documentation configured.