using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Exceptions;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Persistence;
using ConwayGameOfLife.Application.Responses;
using ConwayGameOfLife.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ConwayGameOfLife.Application;

public sealed class GameService(
    IGameBoardRepository repository,
    IGameEngine engine,
    IOptions<GameLimitsOptions> limitsOptions,
    ILogger<GameService> logger) : IGameService
{
    private readonly GameLimitsOptions _limits = limitsOptions.Value;

    public async Task<BoardStateResponse> GetBoardStateAsync(Guid boardId, CancellationToken cancellationToken = default)
    {
        var record = await repository.GetByIdAsync(boardId, cancellationToken).ConfigureAwait(false)
            ?? throw new BoardNotFoundException(boardId);

        logger.LogDebug("Read board {BoardId} state.", boardId);
        return ToResponse(record);
    }

    public async Task<IReadOnlyList<BoardSummaryResponse>> ListBoardsAsync(CancellationToken cancellationToken = default)
    {
        var list = await repository.ListSummariesAsync(cancellationToken).ConfigureAwait(false);
        logger.LogDebug("Listed {Count} board(s).", list.Count);
        return list;
    }

    public async Task<BoardCreatedResponse> CreateBoardAsync(CreateBoardCommand command, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var rows = command.Cells ?? throw new GameValidationException("Cells are required.");
        var board = Board.FromJagged(rows);
        EnsureWithinLimits(board);

        var id = Guid.NewGuid();
        await repository.AddAsync(new GameBoardRecord { Id = id, Board = board }, cancellationToken).ConfigureAwait(false);
        logger.LogInformation("Created board {BoardId} with size {Rows}x{Columns}.", id, board.RowCount, board.ColumnCount);

        return new BoardCreatedResponse(id);
    }

    public async Task<BoardStateResponse> GetNextGenerationAsync(Guid boardId, CancellationToken cancellationToken = default)
    {
        var record = await repository.GetByIdAsync(boardId, cancellationToken).ConfigureAwait(false)
            ?? throw new BoardNotFoundException(boardId);

        var next = engine.ComputeNext(record.Board);
        record.Board = next;
        await repository.UpdateAsync(record, cancellationToken).ConfigureAwait(false);

        logger.LogDebug("Board {BoardId} advanced one generation.", boardId);
        return ToResponse(record);
    }

    public async Task<BoardStateResponse> AdvanceAsync(Guid boardId, int steps, CancellationToken cancellationToken = default)
    {
        if (steps < 1)
            throw new GameValidationException("Steps must be at least 1.");

        if (steps > _limits.MaxAdvanceSteps)
        {
            throw new GameValidationException(
                $"Steps cannot exceed {_limits.MaxAdvanceSteps} (configured limit).");
        }

        var record = await repository.GetByIdAsync(boardId, cancellationToken).ConfigureAwait(false)
            ?? throw new BoardNotFoundException(boardId);

        var current = record.Board;
        for (var i = 0; i < steps; i++)
            current = engine.ComputeNext(current);

        record.Board = current;
        await repository.UpdateAsync(record, cancellationToken).ConfigureAwait(false);

        logger.LogInformation("Board {BoardId} advanced by {Steps} generation(s).", boardId, steps);
        return ToResponse(record);
    }

    public async Task<BoardStateResponse> GetFinalStableStateAsync(Guid boardId, int maxAttempts, CancellationToken cancellationToken = default)
    {
        if (maxAttempts < 1)
            throw new GameValidationException("maxAttempts must be at least 1.");

        if (maxAttempts > _limits.MaxFinalStateAttempts)
        {
            throw new GameValidationException(
                $"maxAttempts cannot exceed {_limits.MaxFinalStateAttempts} (configured limit).");
        }

        var record = await repository.GetByIdAsync(boardId, cancellationToken).ConfigureAwait(false)
            ?? throw new BoardNotFoundException(boardId);

        var current = record.Board;
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var next = engine.ComputeNext(current);
            if (next.Equals(current))
            {
                record.Board = next;
                await repository.UpdateAsync(record, cancellationToken).ConfigureAwait(false);
                logger.LogInformation(
                    "Board {BoardId} reached stable state after {Attempts} attempt(s).",
                    boardId,
                    attempt + 1);

                return ToResponse(record);
            }

            current = next;
        }

        record.Board = current;
        await repository.UpdateAsync(record, cancellationToken).ConfigureAwait(false);

        logger.LogWarning(
            "Board {BoardId} did not stabilize within {MaxAttempts} attempts.",
            boardId,
            maxAttempts);

        throw new FinalStateNotReachedException(boardId, maxAttempts);
    }

    private void EnsureWithinLimits(Board board)
    {
        if (board.RowCount > _limits.MaxRows || board.ColumnCount > _limits.MaxColumns)
        {
            throw new GameValidationException(
                $"Board dimensions cannot exceed {_limits.MaxRows} rows and {_limits.MaxColumns} columns.");
        }
    }

    private static BoardStateResponse ToResponse(GameBoardRecord record) =>
        new(record.Id, record.Board.RowCount, record.Board.ColumnCount, record.Board.ToJagged());
}
