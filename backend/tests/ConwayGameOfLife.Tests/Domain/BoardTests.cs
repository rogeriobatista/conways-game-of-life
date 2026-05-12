using ConwayGameOfLife.Domain.Entities;
using FluentAssertions;

namespace ConwayGameOfLife.Tests.Domain;

public sealed class BoardTests
{
    [Fact]
    public void Constructor_ThrowsWhenCellsNull()
    {
        var act = () => new Board(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_ThrowsWhenNoRows()
    {
        var act = () => new Board(new bool[0, 1]);

        act.Should().Throw<ArgumentException>().WithParameterName("cells");
    }

    [Fact]
    public void Constructor_ThrowsWhenNoColumns()
    {
        var act = () => new Board(new bool[1, 0]);

        act.Should().Throw<ArgumentException>().WithParameterName("cells");
    }

    [Fact]
    public void FromJagged_ThrowsWhenRowsNull()
    {
        var act = () => Board.FromJagged(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void FromJagged_ThrowsWhenNoRows()
    {
        var act = () => Board.FromJagged(Array.Empty<IReadOnlyList<bool>>());

        act.Should().Throw<ArgumentException>().WithParameterName("rows");
    }

    [Fact]
    public void FromJagged_ThrowsWhenFirstRowEmpty()
    {
        var act = () => Board.FromJagged(new List<IReadOnlyList<bool>> { Array.Empty<bool>() });

        act.Should().Throw<ArgumentException>().WithParameterName("rows");
    }

    [Fact]
    public void FromJagged_ThrowsWhenRowWidthsDiffer()
    {
        var rows = new IReadOnlyList<bool>[]
        {
            new[] { true, false },
            new[] { true },
        };

        var act = () => Board.FromJagged(rows);

        act.Should().Throw<ArgumentException>().WithParameterName("rows");
    }

    [Fact]
    public void FromJagged_RoundTripsThroughToJagged()
    {
        var jagged = new[] { new[] { true, false }, new[] { false, true } };
        var board = Board.FromJagged(jagged);

        board.ToJagged().Should().BeEquivalentTo(jagged, o => o.WithStrictOrdering());
    }

    [Fact]
    public void Equals_ReturnsFalseForNull()
    {
        var board = new Board(new[,] { { true } });

        board.Equals((Board?)null).Should().BeFalse();
    }

    [Fact]
    public void Equals_ReturnsFalseWhenDimensionsDiffer()
    {
        var a = new Board(new[,] { { true } });
        var b = new Board(new[,] { { true }, { false } });

        a.Equals(b).Should().BeFalse();
    }

    [Fact]
    public void Equals_ReturnsFalseWhenCellDiffers()
    {
        var a = new Board(new[,] { { true, false } });
        var b = new Board(new[,] { { false, false } });

        a.Equals(b).Should().BeFalse();
    }

    [Fact]
    public void Equals_ObjectOverload_UsesBoardEquals()
    {
        var a = new Board(new[,] { { true } });
        object same = new Board(new[,] { { true } });

        a.Equals(same).Should().BeTrue();
    }

    [Fact]
    public void GetHashCode_IsEqualForEqualBoards()
    {
        var cells = new[,] { { true, false }, { false, true } };
        var a = new Board(cells);
        var b = new Board((bool[,])cells.Clone());

        a.GetHashCode().Should().Be(b.GetHashCode());
    }
}
