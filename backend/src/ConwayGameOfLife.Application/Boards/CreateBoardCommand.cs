namespace ConwayGameOfLife.Application.Boards;

public sealed class CreateBoardCommand
{
    public required bool[][] Cells { get; init; }
}
