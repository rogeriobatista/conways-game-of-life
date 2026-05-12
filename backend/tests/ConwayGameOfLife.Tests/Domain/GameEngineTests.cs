using ConwayGameOfLife.Domain;
using FluentAssertions;

namespace ConwayGameOfLife.Tests.Domain;

public sealed class GameEngineTests
{
    private readonly GameEngine _engine = new();

    [Fact]
    public void ComputeNext_Block_IsUnchanged()
    {
        var next = _engine.ComputeNext(TestBoards.Block2x2);

        next.Equals(TestBoards.Block2x2).Should().BeTrue();
    }

    [Fact]
    public void ComputeNext_AllDead_StaysDead()
    {
        var next = _engine.ComputeNext(TestBoards.AllDead2x2);

        next.Equals(TestBoards.AllDead2x2).Should().BeTrue();
    }

    [Fact]
    public void ComputeNext_BlinkerOscillates_Period2()
    {
        var step1 = _engine.ComputeNext(TestBoards.HorizontalBlinker);
        step1.Equals(TestBoards.VerticalBlinker).Should().BeTrue();

        var step2 = _engine.ComputeNext(step1);
        step2.Equals(TestBoards.HorizontalBlinker).Should().BeTrue();
    }

    [Fact]
    public void ComputeNext_LiveCell_WithOneNeighbor_Dies()
    {
        var next = _engine.ComputeNext(TestBoards.SingleCell);

        next[0, 0].Should().BeFalse();
    }

    [Fact]
    public void ComputeNext_DeadCell_WithThreeNeighbors_BecomesAlive()
    {
        var board = Board.FromJagged(
        [
            [true,  true,  false],
            [true,  false, false],
        ]);

        var next = _engine.ComputeNext(board);

        next[1, 1].Should().BeTrue();
    }
}
