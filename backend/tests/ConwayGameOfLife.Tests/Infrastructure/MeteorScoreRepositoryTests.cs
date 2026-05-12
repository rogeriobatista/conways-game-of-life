using ConwayGameOfLife.Infrastructure.Persistence;
using ConwayGameOfLife.Infrastructure.Persistence.Repositories;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Tests.Infrastructure;

public sealed class MeteorScoreRepositoryTests : IAsyncDisposable
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"cgol_meteor_{Guid.NewGuid()}.db");
    private readonly SqliteConnection _connection;
    private readonly GameDbContext _db;
    private readonly MeteorScoreRepository _sut;

    public MeteorScoreRepositoryTests()
    {
        _connection = new SqliteConnection($"Data Source={_dbPath}");
        _connection.Open();
        var options = new DbContextOptionsBuilder<GameDbContext>().UseSqlite(_connection).Options;
        _db = new GameDbContext(options);
        _db.Database.Migrate();
        _sut = new MeteorScoreRepository(_db);
    }

    public async ValueTask DisposeAsync()
    {
        await _db.DisposeAsync().ConfigureAwait(false);
        await _connection.DisposeAsync().ConfigureAwait(false);
        TryDelete(_dbPath);
    }

    [Fact]
    public async Task AddAsync_ThenListTopByScoreAsync_OrdersByScore()
    {
        var low = await _sut.AddAsync(10, 1, 5);
        var high = await _sut.AddAsync(500, 2, 20);

        var top = await _sut.ListTopByScoreAsync(10);

        top[0].Id.Should().Be(high.Id);
        top[1].Id.Should().Be(low.Id);
    }

    [Fact]
    public async Task ListTopByScoreAsync_TakeZero_ReturnsSingleHighest()
    {
        await _sut.AddAsync(5, 0, 0);
        await _sut.AddAsync(50, 0, 0);

        var top = await _sut.ListTopByScoreAsync(0);

        top.Should().ContainSingle();
        top[0].Score.Should().Be(50);
    }

    [Fact]
    public async Task ListTopByScoreAsync_LargeTake_ReturnsAllAvailableRows()
    {
        for (var i = 0; i < 5; i++)
            await _sut.AddAsync(i + 1, 0, 0);

        var top = await _sut.ListTopByScoreAsync(10_000);

        top.Should().HaveCount(5);
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
