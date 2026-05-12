namespace ConwayGameOfLife.Domain.Entities;

public sealed class Board : IEquatable<Board>
{
    private readonly bool[,] _cells;

    public Board(bool[,] cells)
    {
        ArgumentNullException.ThrowIfNull(cells);
        var rows = cells.GetLength(0);
        var cols = cells.GetLength(1);
        if (rows < 1 || cols < 1)
            throw new ArgumentException("Board must have at least one row and one column.", nameof(cells));

        _cells = (bool[,])cells.Clone();
    }

    public int RowCount => _cells.GetLength(0);

    public int ColumnCount => _cells.GetLength(1);

    public bool this[int row, int column] => _cells[row, column];

    public static Board FromJagged(IReadOnlyList<IReadOnlyList<bool>> rows)
    {
        ArgumentNullException.ThrowIfNull(rows);
        if (rows.Count < 1)
            throw new ArgumentException("Board must have at least one row.", nameof(rows));

        var columnCount = rows[0].Count;
        if (columnCount < 1)
            throw new ArgumentException("Each row must have at least one cell.", nameof(rows));

        var cells = new bool[rows.Count, columnCount];
        for (var r = 0; r < rows.Count; r++)
        {
            var row = rows[r];
            if (row.Count != columnCount)
                throw new ArgumentException("All rows must have the same number of columns.", nameof(rows));

            for (var c = 0; c < columnCount; c++)
                cells[r, c] = row[c];
        }

        return new Board(cells);
    }

    public bool[][] ToJagged()
    {
        var result = new bool[RowCount][];
        for (var r = 0; r < RowCount; r++)
        {
            result[r] = new bool[ColumnCount];
            for (var c = 0; c < ColumnCount; c++)
                result[r][c] = _cells[r, c];
        }

        return result;
    }

    public bool Equals(Board? other)
    {
        if (other is null || RowCount != other.RowCount || ColumnCount != other.ColumnCount)
            return false;

        for (var r = 0; r < RowCount; r++)
        {
            for (var c = 0; c < ColumnCount; c++)
            {
                if (_cells[r, c] != other._cells[r, c])
                    return false;
            }
        }

        return true;
    }

    public override bool Equals(object? obj) => obj is Board other && Equals(other);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        hash.Add(RowCount);
        hash.Add(ColumnCount);
        for (var r = 0; r < RowCount; r++)
        {
            for (var c = 0; c < ColumnCount; c++)
                hash.Add(_cells[r, c]);
        }

        return hash.ToHashCode();
    }
}
