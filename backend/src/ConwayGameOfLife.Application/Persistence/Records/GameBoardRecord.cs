using ConwayGameOfLife.Domain.Entities;

namespace ConwayGameOfLife.Application.Persistence.Records;

public sealed class GameBoardRecord
{
    public required Guid Id { get; init; }

    public required Board Board { get; set; }
}
