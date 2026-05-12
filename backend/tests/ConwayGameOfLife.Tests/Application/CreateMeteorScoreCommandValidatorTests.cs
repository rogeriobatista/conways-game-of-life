using ConwayGameOfLife.Application.MeteorScores;
using FluentAssertions;

namespace ConwayGameOfLife.Tests.Application;

public sealed class CreateMeteorScoreCommandValidatorTests
{
    private readonly CreateMeteorScoreCommandValidator _sut = new();

    [Theory]
    [InlineData(-1, 0, 0)]
    [InlineData(10_000_001, 0, 0)]
    [InlineData(0, -1, 0)]
    [InlineData(0, 1_000_001, 0)]
    [InlineData(0, 0, -1)]
    [InlineData(0, 0, 50_000_001)]
    public async Task Validate_FailsWhenOutOfRange(int score, int locks, int placed)
    {
        var result = await _sut.ValidateAsync(new CreateMeteorScoreCommand(score, locks, placed));

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task Validate_SucceedsAtBoundaries()
    {
        var result = await _sut.ValidateAsync(new CreateMeteorScoreCommand(0, 0, 0));
        result.IsValid.Should().BeTrue();

        result = await _sut.ValidateAsync(new CreateMeteorScoreCommand(10_000_000, 1_000_000, 50_000_000));
        result.IsValid.Should().BeTrue();
    }
}
