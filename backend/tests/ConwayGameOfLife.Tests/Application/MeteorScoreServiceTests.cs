using ConwayGameOfLife.Application;
using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Persistence;
using ConwayGameOfLife.Application.Responses;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ConwayGameOfLife.Tests.Application;

public sealed class MeteorScoreServiceTests
{
    [Fact]
    public async Task RecordScoreAsync_PersistsViaRepository()
    {
        var created = new MeteorScoreResponse(Guid.NewGuid(), 425, 7, 40, DateTime.UtcNow);
        var repo = new Mock<IMeteorScoreRepository>();
        repo.Setup(r => r.AddAsync(425, 7, 40, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var sut = new MeteorScoreService(repo.Object, NullLogger<MeteorScoreService>.Instance);

        var result = await sut.RecordScoreAsync(new CreateMeteorScoreCommand(425, 7, 40));

        result.Should().Be(created);
        repo.Verify(r => r.AddAsync(425, 7, 40, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ListTopScoresAsync_DelegatesToRepository()
    {
        var list = new List<MeteorScoreResponse>
        {
            new(Guid.NewGuid(), 900, 3, 20, DateTime.UtcNow),
        };
        var repo = new Mock<IMeteorScoreRepository>();
        repo.Setup(r => r.ListTopByScoreAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(list);

        var sut = new MeteorScoreService(repo.Object, NullLogger<MeteorScoreService>.Instance);

        var result = await sut.ListTopScoresAsync(10);

        result.Should().BeEquivalentTo(list);
    }
}
