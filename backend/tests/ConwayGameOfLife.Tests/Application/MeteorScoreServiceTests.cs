using ConwayGameOfLife.Application.MeteorScores;
using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Application.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ConwayGameOfLife.Tests.Application;

public sealed class MeteorScoreServiceTests
{
    [Fact]
    public async Task RecordScoreAsync_PersistsViaRepository()
    {
        var created = new MeteorScore(Guid.NewGuid(), 425, 7, 40, DateTime.UtcNow);
        var repo = new Mock<IMeteorScoreRepository>();
        repo.Setup(r => r.AddAsync(425, 7, 40, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var sut = new MeteorScoreService(repo.Object, NullLogger<MeteorScoreService>.Instance);

        var result = await sut.RecordScoreAsync(new CreateMeteorScoreCommand(425, 7, 40));

        result.Should().BeEquivalentTo(created);
        repo.Verify(r => r.AddAsync(425, 7, 40, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListTopScoresAsync_DelegatesToRepository()
    {
        var list = new List<MeteorScore>
        {
            new(Guid.NewGuid(), 900, 3, 20, DateTime.UtcNow),
        };
        var repo = new Mock<IMeteorScoreRepository>();
        repo.Setup(r => r.ListTopByScoreAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(list);

        var sut = new MeteorScoreService(repo.Object, NullLogger<MeteorScoreService>.Instance);

        var result = await sut.ListTopScoresAsync(10);

        result.Should().BeEquivalentTo(list, o => o.WithStrictOrdering());
    }
}
