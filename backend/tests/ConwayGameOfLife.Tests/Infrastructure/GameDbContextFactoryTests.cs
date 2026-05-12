using ConwayGameOfLife.Infrastructure.Persistence;
using FluentAssertions;

namespace ConwayGameOfLife.Tests.Infrastructure;

public sealed class GameDbContextFactoryTests
{
    [Fact]
    public void CreateDbContext_ReturnsContextWithBoardsDbSet()
    {
        var factory = new GameDbContextFactory();
        using var ctx = factory.CreateDbContext([]);

        ctx.Should().NotBeNull();
        ctx.Boards.Should().NotBeNull();
        ctx.MeteorScores.Should().NotBeNull();
    }
}
