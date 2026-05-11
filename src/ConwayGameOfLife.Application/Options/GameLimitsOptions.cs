namespace ConwayGameOfLife.Application.Options;

public sealed class GameLimitsOptions
{
    public const string SectionName = "Game";

    public int MaxRows { get; init; } = 500;

    public int MaxColumns { get; init; } = 500;

    public int MaxAdvanceSteps { get; init; } = 10_000;

    public int MaxFinalStateAttempts { get; init; } = 100_000;

    public int DefaultFinalStateMaxAttempts { get; init; } = 1_000;
}
