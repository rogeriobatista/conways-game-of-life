using ConwayGameOfLife.Application;
using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Exceptions;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Persistence;
using ConwayGameOfLife.Application.Responses;
using ConwayGameOfLife.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace ConwayGameOfLife.Tests.Application;

public sealed class GameServiceTests
{
    private static GameLimitsOptions Limits =>
        new()
        {
            MaxRows = 50,
            MaxColumns = 50,
            MaxAdvanceSteps = 500,
            MaxFinalStateAttempts = 200,
            DefaultFinalStateMaxAttempts = 50
        };

    private static GameService CreateSut(
        Mock<IGameBoardRepository> repo,
        IGameEngine? engine = null) =>
        new(
            repo.Object,
            engine ?? new GameEngine(),
            Options.Create(Limits),
            NullLogger<GameService>.Instance);

    [Fact]
    public async Task ListBoardsAsync_ReturnsSummariesFromRepository()
    {
        var id = Guid.NewGuid();
        var updated = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);
        var summaries = new List<BoardSummaryResponse>
        {
            new(id, Rows: 3, Columns: 3, updated)
        };

        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.ListSummariesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(summaries);

        var sut = CreateSut(repo);

        var result = await sut.ListBoardsAsync();

        result.Should().HaveCount(1);
        result[0].Id.Should().Be(id);
        result[0].Rows.Should().Be(3);
        result[0].Columns.Should().Be(3);
        result[0].UpdatedAtUtc.Should().Be(updated);
        repo.Verify(r => r.ListSummariesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateBoardAsync_PersistsBoard()
    {
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.AddAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut(repo);
        var command = new CreateBoardCommand
        {
            Cells =
            [
                [false, true, false],
                [false, true, false],
                [false, true, false]
            ]
        };

        var result = await sut.CreateBoardAsync(command);

        result.Id.Should().NotBeEmpty();
        repo.Verify(
            r => r.AddAsync(
                It.Is<GameBoardRecord>(g => g.Id == result.Id && g.Board.RowCount == 3 && g.Board.ColumnCount == 3),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetFinalStableStateAsync_Block_ReturnsImmediately()
    {
        var block = Board.FromJagged(
            new[]
            {
                new[] { true, true },
                new[] { true, true }
            });

        var id = Guid.NewGuid();
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameBoardRecord { Id = id, Board = block });

        repo.Setup(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut(repo);

        var response = await sut.GetFinalStableStateAsync(id, maxAttempts: 10);

        response.Cells.Should().BeEquivalentTo(block.ToJagged(), options => options.WithStrictOrdering());
        repo.Verify(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetFinalStableStateAsync_Blinker_ThrowsWhenNotStableWithinAttempts()
    {
        var blinker = Board.FromJagged(
            new[]
            {
                new[] { false, false, false },
                new[] { true, true, true },
                new[] { false, false, false }
            });

        var id = Guid.NewGuid();
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameBoardRecord { Id = id, Board = blinker });

        repo.Setup(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut(repo);

        var act = async () => await sut.GetFinalStableStateAsync(id, maxAttempts: 6);

        await act.Should().ThrowAsync<FinalStateNotReachedException>();
        repo.Verify(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AdvanceAsync_AppliesSteps()
    {
        var horizontal = Board.FromJagged(
            new[]
            {
                new[] { false, false, false },
                new[] { true, true, true },
                new[] { false, false, false }
            });

        var id = Guid.NewGuid();
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameBoardRecord { Id = id, Board = horizontal });

        repo.Setup(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut(repo);

        var afterTwo = await sut.AdvanceAsync(id, steps: 2);

        afterTwo.Cells.Should().BeEquivalentTo(horizontal.ToJagged(), options => options.WithStrictOrdering());
    }

    [Fact]
    public async Task GetNextGenerationAsync_UpdatesStoredBoard()
    {
        var horizontal = Board.FromJagged(
            new[]
            {
                new[] { false, false, false },
                new[] { true, true, true },
                new[] { false, false, false }
            });

        var engine = new GameEngine();
        var expectedNext = engine.ComputeNext(horizontal);

        var id = Guid.NewGuid();
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameBoardRecord { Id = id, Board = horizontal });

        repo.Setup(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = CreateSut(repo, engine);

        var response = await sut.GetNextGenerationAsync(id);

        response.Cells.Should().BeEquivalentTo(expectedNext.ToJagged(), options => options.WithStrictOrdering());
    }
}
