namespace ConwayGameOfLife.Application.Responses;

public sealed record BoardStateResponse(Guid Id, int Rows, int Columns, bool[][] Cells);
