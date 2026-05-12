namespace ConwayGameOfLife.Application.Persistence;

/// <summary>
/// Board summary as read from persistence (not an HTTP contract type).
/// </summary>
public sealed record BoardListEntry(Guid Id, int Rows, int Columns, DateTime UpdatedAtUtc);
