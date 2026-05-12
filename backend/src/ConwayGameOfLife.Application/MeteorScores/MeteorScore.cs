namespace ConwayGameOfLife.Application.MeteorScores;

/// <summary>
/// Meteor score as returned from persistence and from the API (single projection, DRY).
/// </summary>
public sealed record MeteorScore(Guid Id, int Score, int Locks, int PlacedCellTotal, DateTime CreatedAtUtc);
