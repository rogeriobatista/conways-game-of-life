using ConwayGameOfLife.Application.Options;
using FluentAssertions;

namespace ConwayGameOfLife.Tests.Application;

public sealed class GameLimitsOptionsTests
{
    [Fact]
    public void ResolveFinalStateMaxAttempts_UsesDefaultWhenNull()
    {
        var o = new GameLimitsOptions { DefaultFinalStateMaxAttempts = 42 };

        o.ResolveFinalStateMaxAttempts(null).Should().Be(42);
    }

    [Fact]
    public void ResolveFinalStateMaxAttempts_UsesProvidedValue()
    {
        var o = new GameLimitsOptions { DefaultFinalStateMaxAttempts = 42 };

        o.ResolveFinalStateMaxAttempts(99).Should().Be(99);
    }

    [Fact]
    public void ResolveLeaderboardTop_UsesDefaultWhenNull()
    {
        var o = new GameLimitsOptions { DefaultLeaderboardTop = 12 };

        o.ResolveLeaderboardTop(null).Should().Be(12);
    }
}
