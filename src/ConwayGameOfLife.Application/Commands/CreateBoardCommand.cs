namespace ConwayGameOfLife.Application.Commands;

public sealed class CreateBoardCommand
{
    public required bool[][] Cells { get; init; }
}
