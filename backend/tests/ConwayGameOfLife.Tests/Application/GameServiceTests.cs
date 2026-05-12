using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Application.Exceptions;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Persistence.Records;
using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Application.Services;
using ConwayGameOfLife.Domain.Entities;
using ConwayGameOfLife.Domain.Simulation;
using ConwayGameOfLife.Tests.Fixtures;
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
            DefaultFinalStateMaxAttempts = 50,
            DefaultLeaderboardTop = 10,
        };

    private static GameService CreateSut(
        Mock<IGameBoardRepository> repo,
        IGameEngine? engine = null) =>
        new(
            repo.Object,
            engine ?? new GameEngine(),
            Options.Create(Limits),
            NullLogger<GameService>.Instance);

    private static Mock<IGameBoardRepository> RepoWith(Guid id, Board board)
    {
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GameBoardRecord { Id = id, Board = board });
        repo.Setup(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        return repo;
    }

    [Fact]
    public async Task GetBoardStateAsync_ReturnsCurrentBoardWithoutUpdate()
    {
        var id = Guid.NewGuid();
        var repo = RepoWith(id, TestBoards.Block2x2);
        var sut = CreateSut(repo);

        var response = await sut.GetBoardStateAsync(id);

        response.Cells.Should().BeEquivalentTo(TestBoards.Block2x2.ToJagged(), o => o.WithStrictOrdering());
        repo.Verify(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ListBoardsAsync_ReturnsSummariesFromRepository()
    {
        var id = Guid.NewGuid();
        var updated = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);
        var summaries = new List<BoardSummary> { new(id, Rows: 3, Columns: 3, updated) };

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
                [false, true,  false],
                [false, true,  false],
                [false, true,  false],
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
        var id = Guid.NewGuid();
        var repo = RepoWith(id, TestBoards.Block2x2);
        var sut = CreateSut(repo);

        var response = await sut.GetFinalStableStateAsync(id, maxAttempts: 10);

        response.Cells.Should().BeEquivalentTo(TestBoards.Block2x2.ToJagged(), o => o.WithStrictOrdering());
        repo.Verify(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetFinalStableStateAsync_Blinker_ThrowsWhenNotStableWithinAttempts()
    {
        var id = Guid.NewGuid();
        var repo = RepoWith(id, TestBoards.HorizontalBlinker);
        var sut = CreateSut(repo);

        var act = async () => await sut.GetFinalStableStateAsync(id, maxAttempts: 6);

        await act.Should().ThrowAsync<FinalStateNotReachedException>();
        repo.Verify(r => r.UpdateAsync(It.IsAny<GameBoardRecord>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AdvanceAsync_AppliesSteps()
    {
        var id = Guid.NewGuid();
        var repo = RepoWith(id, TestBoards.HorizontalBlinker);
        var sut = CreateSut(repo);

        // Blinker oscillates with period 2; two steps returns to the original state.
        var afterTwo = await sut.AdvanceAsync(id, steps: 2);

        afterTwo.Cells.Should().BeEquivalentTo(TestBoards.HorizontalBlinker.ToJagged(), o => o.WithStrictOrdering());
    }

    [Fact]
    public async Task GetNextGenerationAsync_UpdatesStoredBoard()
    {
        var engine = new GameEngine();
        var expectedNext = engine.ComputeNext(TestBoards.HorizontalBlinker);

        var id = Guid.NewGuid();
        var repo = RepoWith(id, TestBoards.HorizontalBlinker);
        var sut = CreateSut(repo, engine);

        var response = await sut.GetNextGenerationAsync(id);

        response.Cells.Should().BeEquivalentTo(expectedNext.ToJagged(), o => o.WithStrictOrdering());
    }

    [Fact]
    public async Task DeleteBoardAsync_CallsRepositoryDelete()
    {
        var id = Guid.NewGuid();
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var sut = CreateSut(repo);

        await sut.DeleteBoardAsync(id);

        repo.Verify(r => r.DeleteAsync(id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteBoardAsync_ThrowsWhenMissing()
    {
        var id = Guid.NewGuid();
        var repo = new Mock<IGameBoardRepository>();
        repo.Setup(r => r.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var sut = CreateSut(repo);

        var act = async () => await sut.DeleteBoardAsync(id);

        await act.Should().ThrowAsync<BoardNotFoundException>();
    }

    [Fact]
    public async Task ReplaceBoardAsync_UpdatesStoredCells()
    {
        var id = Guid.NewGuid();
        var repo = RepoWith(id, TestBoards.Block2x2);
        var sut = CreateSut(repo);

        var empty = new bool[][] { [false, false], [false, false] };
        var cmd = new CreateBoardCommand { Cells = empty };

        var response = await sut.ReplaceBoardAsync(id, cmd);

        response.Cells.Should().BeEquivalentTo(empty, o => o.WithStrictOrdering());
        repo.Verify(
            r => r.UpdateAsync(
                It.Is<GameBoardRecord>(g => g.Id == id && g.Board.RowCount == 2 && !g.Board[0, 0]),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
