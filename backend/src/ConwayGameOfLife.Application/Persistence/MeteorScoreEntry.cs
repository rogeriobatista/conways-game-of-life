namespace ConwayGameOfLife.Application.Persistence;

/// <summary>
/// Meteor score row as read from persistence (not an HTTP contract type).
/// </summary>
public sealed record MeteorScoreEntry(Guid Id, int Score, int Locks, int PlacedCellTotal, DateTime CreatedAtUtc);
