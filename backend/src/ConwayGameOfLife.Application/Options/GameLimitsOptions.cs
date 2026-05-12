namespace ConwayGameOfLife.Application.Options;

public sealed class GameLimitsOptions
{
    public const string SectionName = "Game";

    public int MaxRows { get; init; } = 500;

    public int MaxColumns { get; init; } = 500;

    public int MaxAdvanceSteps { get; init; } = 10_000;

    public int MaxFinalStateAttempts { get; init; } = 100_000;

    public int DefaultFinalStateMaxAttempts { get; init; } = 1_000;

    /// <summary>Default number of entries returned by the meteor-score leaderboard when the caller omits the <c>top</c> query parameter.</summary>
    public int DefaultLeaderboardTop { get; init; } = 25;

    /// <summary>Uses <paramref name="requested"/> when set; otherwise <see cref="DefaultFinalStateMaxAttempts"/>.</summary>
    public int ResolveFinalStateMaxAttempts(int? requested) => requested ?? DefaultFinalStateMaxAttempts;

    /// <summary>Uses <paramref name="requested"/> when set; otherwise <see cref="DefaultLeaderboardTop"/>.</summary>
    public int ResolveLeaderboardTop(int? requested) => requested ?? DefaultLeaderboardTop;
}
