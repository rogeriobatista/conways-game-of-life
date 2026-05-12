using ConwayGameOfLife.Domain;

namespace ConwayGameOfLife.Tests;

/// <summary>
/// Shared Conway board fixtures used across test classes.
/// Defined once here to avoid duplicating cell arrays in every test.
/// </summary>
internal static class TestBoards
{
    /// <summary>2×2 still life — never changes.</summary>
    public static Board Block2x2 => Board.FromJagged(
    [
        [true,  true],
        [true,  true],
    ]);

    /// <summary>2×2 entirely dead grid.</summary>
    public static Board AllDead2x2 => Board.FromJagged(
    [
        [false, false],
        [false, false],
    ]);

    /// <summary>3×3 horizontal blinker (period-2 oscillator, phase A).</summary>
    public static Board HorizontalBlinker => Board.FromJagged(
    [
        [false, false, false],
        [true,  true,  true],
        [false, false, false],
    ]);

    /// <summary>3×3 vertical blinker (period-2 oscillator, phase B).</summary>
    public static Board VerticalBlinker => Board.FromJagged(
    [
        [false, true, false],
        [false, true, false],
        [false, true, false],
    ]);

    /// <summary>Single live cell — dies next generation (under-population).</summary>
    public static Board SingleCell => Board.FromJagged(
    [
        [true,  false],
        [false, false],
    ]);
}
