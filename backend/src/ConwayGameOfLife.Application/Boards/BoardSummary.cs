namespace ConwayGameOfLife.Application.Boards;

/// <summary>
/// Lightweight board listing (API and persistence list projections share this shape).
/// </summary>
public sealed record BoardSummary(Guid Id, int Rows, int Columns, DateTime UpdatedAtUtc);
