namespace ConwayGameOfLife.Application.Responses;

public sealed record BoardSummaryResponse(Guid Id, int Rows, int Columns, DateTime UpdatedAtUtc);
