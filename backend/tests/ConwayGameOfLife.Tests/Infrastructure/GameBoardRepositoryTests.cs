using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Application.Exceptions;
using ConwayGameOfLife.Application.Persistence.Records;
using ConwayGameOfLife.Domain.Entities;
using ConwayGameOfLife.Infrastructure.Persistence;
using ConwayGameOfLife.Infrastructure.Persistence.Repositories;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Tests.Infrastructure;

public sealed class GameBoardRepositoryTests : IAsyncDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"cgol_repo_{Guid.NewGuid()}.db");
    private readonly SqliteConnection _connection;
    private readonly GameDbContext _db;
    private readonly GameBoardRepository _sut;

    public GameBoardRepositoryTests()
    {
        _connection = new SqliteConnection($"Data Source={_dbPath}");
        _connection.Open();
        var options = new DbContextOptionsBuilder<GameDbContext>().UseSqlite(_connection).Options;
        _db = new GameDbContext(options);
        _db.Database.Migrate();
        _sut = new GameBoardRepository(_db);
    }

    public async ValueTask DisposeAsync()
    {
        await _db.DisposeAsync().ConfigureAwait(false);
        await _connection.DisposeAsync().ConfigureAwait(false);
        TryDelete(_dbPath);
    }

    [Fact]
    public async Task AddGet_Update_Delete_RoundTrip()
    {
        var board = Board.FromJagged(new[] { new[] { true, false }, new[] { false, true } });
        var id = Guid.NewGuid();

        await _sut.AddAsync(new GameBoardRecord { Id = id, Board = board });

        var loaded = await _sut.GetByIdAsync(id);
        loaded.Should().NotBeNull();
        loaded!.Board.Equals(board).Should().BeTrue();

        var updated = Board.FromJagged(new[] { new[] { false, false } });
        await _sut.UpdateAsync(new GameBoardRecord { Id = id, Board = updated });

        (await _sut.GetByIdAsync(id))!.Board.Equals(updated).Should().BeTrue();

        (await _sut.DeleteAsync(id)).Should().BeTrue();
        (await _sut.GetByIdAsync(id)).Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_ThrowsWhenBoardMissing()
    {
        var id = Guid.NewGuid();
        var act = async () =>
            await _sut.UpdateAsync(
                new GameBoardRecord { Id = id, Board = new Board(new[,] { { true } }) });

        await act.Should().ThrowAsync<BoardNotFoundException>();
    }

    [Fact]
    public async Task ListSummariesAsync_ThrowsWhenStateJsonIsEmptyArray()
    {
        var id = Guid.NewGuid();
        var stateJson = "[]";
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"INSERT INTO Boards (Id, StateJson, UpdatedAtUtc) VALUES ({id}, {stateJson}, {DateTime.UtcNow})");

        var act = async () => await _sut.ListSummariesAsync();

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*non-empty JSON array*");
    }

    [Fact]
    public async Task ListSummariesAsync_ThrowsWhenFirstRowIsNotArray()
    {
        var id = Guid.NewGuid();
        var stateJson = "[1]";
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"INSERT INTO Boards (Id, StateJson, UpdatedAtUtc) VALUES ({id}, {stateJson}, {DateTime.UtcNow})");

        var act = async () => await _sut.ListSummariesAsync();

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*non-empty JSON array*");
    }

    [Fact]
    public async Task GetByIdAsync_ThrowsWhenStateJsonDeserializesToNull()
    {
        var id = Guid.NewGuid();
        var stateJson = "null";
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $@"INSERT INTO Boards (Id, StateJson, UpdatedAtUtc) VALUES ({id}, {stateJson}, {DateTime.UtcNow})");

        var act = async () => await _sut.GetByIdAsync(id);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*invalid stored state*");
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
            /* best effort */
        }
    }
}
