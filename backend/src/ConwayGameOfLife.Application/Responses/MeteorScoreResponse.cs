namespace ConwayGameOfLife.Application.Responses;

public sealed record MeteorScoreResponse(Guid Id, int Score, int Locks, int PlacedCellTotal, DateTime CreatedAtUtc);
