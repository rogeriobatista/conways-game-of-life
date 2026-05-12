using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Application.Exceptions;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Persistence.Records;
using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Application.Services;
using ConwayGameOfLife.Application.Validation;
using ConwayGameOfLife.Domain.Entities;
using ConwayGameOfLife.Domain.Simulation;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace ConwayGameOfLife.Tests.Application;

public sealed class BoardGridLimitsTests
{
    [Fact]
    public void EnsureBoardWithinLimits_AllowsBoardAtExactMax()
    {
        var limits = new GameLimitsOptions { MaxRows = 2, MaxColumns = 3 };
        var board = new Board(new bool[,] { { false, true, false }, { false, true, false } });

        var act = () => BoardGridLimits.EnsureBoardWithinLimits(board, limits);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureBoardWithinLimits_ThrowsWhenRowsExceedMax()
    {
        var limits = new GameLimitsOptions { MaxRows = 1, MaxColumns = 10 };
        var board = new Board(new bool[,] { { true }, { false } });

        var act = () => BoardGridLimits.EnsureBoardWithinLimits(board, limits);

        act.Should()
            .Throw<GameValidationException>()
            .WithMessage("*1 rows*10 columns*");
    }

    [Fact]
    public void EnsureBoardWithinLimits_ThrowsWhenColumnsExceedMax()
    {
        var limits = new GameLimitsOptions { MaxRows = 10, MaxColumns = 1 };
        var board = new Board(new bool[,] { { true, false } });

        var act = () => BoardGridLimits.EnsureBoardWithinLimits(board, limits);

        act.Should().Throw<GameValidationException>();
    }

    [Fact]
    public void EnsureBoardWithinLimits_ThrowsWhenBoardNull()
    {
        var act = () => BoardGridLimits.EnsureBoardWithinLimits(null!, new GameLimitsOptions());

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void EnsureBoardWithinLimits_ThrowsWhenLimitsNull()
    {
        var act = () => BoardGridLimits.EnsureBoardWithinLimits(new Board(new[,] { { true } }), null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void RowCountExceededMessage_IncludesMaxRows()
    {
        var limits = new GameLimitsOptions { MaxRows = 42, MaxColumns = 1 };
        BoardGridLimits.RowCountExceededMessage(limits).Should().Be("Row count cannot exceed 42.");
    }

    [Fact]
    public void ColumnCountPerRowExceededMessage_IncludesMaxColumns()
    {
        var limits = new GameLimitsOptions { MaxRows = 1, MaxColumns = 7 };
        BoardGridLimits.ColumnCountPerRowExceededMessage(limits).Should().Be("Column count cannot exceed 7.");
    }

    [Fact]
    public void UniformRowsMessage_IncludesMaxColumns()
    {
        var limits = new GameLimitsOptions { MaxRows = 1, MaxColumns = 9 };
        BoardGridLimits.UniformRowsMessage(limits).Should().Contain("9");
    }
}

public sealed class GameServiceDimensionTests
{
    private static GameLimitsOptions TightLimits =>
        new()
        {
            MaxRows = 2,
            MaxColumns = 2,
            MaxAdvanceSteps = 10,
            MaxFinalStateAttempts = 100,
            DefaultFinalStateMaxAttempts = 50,
            DefaultLeaderboardTop = 10,
        };

    [Fact]
    public async Task CreateBoardAsync_ThrowsWhenBoardExceedsRowLimit()
    {
        var repo = new Mock<IGameBoardRepository>();
        var sut = new GameService(
            repo.Object,
            new GameEngine(),
            Options.Create(TightLimits),
            NullLogger<GameService>.Instance);

        var cells = new bool[][]
        {
            [true, false],
            [false, true],
            [true, false],
        };
        var act = async () => await sut.CreateBoardAsync(new CreateBoardCommand { Cells = cells });

        await act.Should().ThrowAsync<GameValidationException>();
        repo.Verify(r => r.AddAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}