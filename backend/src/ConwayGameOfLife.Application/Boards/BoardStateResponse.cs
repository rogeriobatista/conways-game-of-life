namespace ConwayGameOfLife.Application.Boards;

public sealed record BoardStateResponse(Guid Id, int Rows, int Columns, bool[][] Cells);
