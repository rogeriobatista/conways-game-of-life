using ConwayGameOfLife.Domain.Entities;

namespace ConwayGameOfLife.Domain.Simulation;

public sealed class GameEngine : IGameEngine
{
    public Board ComputeNext(Board board)
    {
        ArgumentNullException.ThrowIfNull(board);
        var rows = board.RowCount;
        var cols = board.ColumnCount;
        var next = new bool[rows, cols];

        for (var r = 0; r < rows; r++)
        {
            for (var c = 0; c < cols; c++)
            {
                var liveNeighbors = CountLiveNeighbors(board, r, c);
                var alive = board[r, c];
                next[r, c] = alive
                    ? liveNeighbors is 2 or 3
                    : liveNeighbors == 3;
            }
        }

        return new Board(next);
    }

    private static int CountLiveNeighbors(Board board, int row, int column)
    {
        var count = 0;
        for (var dr = -1; dr <= 1; dr++)
        {
            for (var dc = -1; dc <= 1; dc++)
            {
                if (dr == 0 && dc == 0)
                    continue;

                var nr = row + dr;
                var nc = column + dc;
                if ((uint)nr < (uint)board.RowCount && (uint)nc < (uint)board.ColumnCount && board[nr, nc])
                    count++;
            }
        }

        return count;
    }
}
