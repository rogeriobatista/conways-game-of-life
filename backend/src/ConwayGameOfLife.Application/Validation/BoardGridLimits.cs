using ConwayGameOfLife.Application.Exceptions;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Domain.Entities;

namespace ConwayGameOfLife.Application.Validation;

/// <summary>
/// Single place for grid size limits used by <see cref="Validators.CreateBoardCommandValidator"/> and <see cref="Services.GameService"/>.
/// </summary>
public static class BoardGridLimits
{
    public static void EnsureBoardWithinLimits(Board board, GameLimitsOptions limits)
    {
        ArgumentNullException.ThrowIfNull(board);
        ArgumentNullException.ThrowIfNull(limits);

        if (board.RowCount > limits.MaxRows || board.ColumnCount > limits.MaxColumns)
        {
            throw new GameValidationException(
                $"Board dimensions cannot exceed {limits.MaxRows} rows and {limits.MaxColumns} columns.");
        }
    }

    public static string RowCountExceededMessage(GameLimitsOptions limits) =>
        $"Row count cannot exceed {limits.MaxRows}.";

    public static string ColumnCountPerRowExceededMessage(GameLimitsOptions limits) =>
        $"Column count cannot exceed {limits.MaxColumns}.";

    public static string UniformRowsMessage(GameLimitsOptions limits) =>
        $"All rows must have the same number of columns, between 1 and {limits.MaxColumns}, with no null rows.";
}
