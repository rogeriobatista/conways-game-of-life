using ConwayGameOfLife.Domain.Entities;

namespace ConwayGameOfLife.Application.Persistence.Records;

/// <summary>
/// Board aggregate as loaded or persisted through <see cref="ConwayGameOfLife.Application.Persistence.Repositories.IGameBoardRepository"/> (domain <see cref="ConwayGameOfLife.Domain.Entities.Board"/> plus identity).
/// </summary>
public sealed class GameBoardRecord
{
    public required Guid Id { get; init; }

    public required Board Board { get; set; }
}
