using ConwayGameOfLife.Domain.Entities;

namespace ConwayGameOfLife.Application.Persistence;

public sealed class GameBoardRecord
{
    public required Guid Id { get; init; }

    public required Board Board { get; set; }
}
