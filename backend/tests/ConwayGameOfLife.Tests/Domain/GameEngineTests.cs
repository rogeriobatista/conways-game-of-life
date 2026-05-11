using ConwayGameOfLife.Domain;
using FluentAssertions;

namespace ConwayGameOfLife.Tests.Domain;

public sealed class GameEngineTests
{
    private readonly GameEngine _engine = new();

    [Fact]
    public void ComputeNext_Block_IsUnchanged()
    {
        var block = Board.FromJagged(
            new[]
            {
                new[] { true, true },
                new[] { true, true }
            });

        var next = _engine.ComputeNext(block);

        next.Equals(block).Should().BeTrue();
    }

    [Fact]
    public void ComputeNext_AllDead_StaysDead()
    {
        var dead = Board.FromJagged(
            new[]
            {
                new[] { false, false },
                new[] { false, false }
            });

        var next = _engine.ComputeNext(dead);

        next.Equals(dead).Should().BeTrue();
    }

    [Fact]
    public void ComputeNext_BlinkerOscillates_Period2()
    {
        var horizontal = Board.FromJagged(
            new[]
            {
                new[] { false, false, false },
                new[] { true, true, true },
                new[] { false, false, false }
            });

        var vertical = Board.FromJagged(
            new[]
            {
                new[] { false, true, false },
                new[] { false, true, false },
                new[] { false, true, false }
            });

        var step1 = _engine.ComputeNext(horizontal);
        step1.Equals(vertical).Should().BeTrue();

        var step2 = _engine.ComputeNext(step1);
        step2.Equals(horizontal).Should().BeTrue();
    }

    [Fact]
    public void ComputeNext_LiveCell_WithOneNeighbor_Dies()
    {
        var board = Board.FromJagged(
            new[]
            {
                new[] { true, false },
                new[] { false, false }
            });

        var next = _engine.ComputeNext(board);

        next[0, 0].Should().BeFalse();
    }

    [Fact]
    public void ComputeNext_DeadCell_WithThreeNeighbors_BecomesAlive()
    {
        var board = Board.FromJagged(
            new[]
            {
                new[] { true, true, false },
                new[] { true, false, false }
            });

        var next = _engine.ComputeNext(board);

        next[1, 1].Should().BeTrue();
    }
}
