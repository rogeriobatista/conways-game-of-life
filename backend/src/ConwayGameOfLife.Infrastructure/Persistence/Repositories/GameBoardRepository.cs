using System.Text.Json;
using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Application.Exceptions;
using ConwayGameOfLife.Application.Persistence.Records;
using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Domain.Entities;
using ConwayGameOfLife.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Infrastructure.Persistence.Repositories;

public sealed class GameBoardRepository(GameDbContext dbContext) : IGameBoardRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<IReadOnlyList<BoardSummary>> ListSummariesAsync(CancellationToken cancellationToken = default)
    {
        var rows = await dbContext.Boards.AsNoTracking()
            .OrderByDescending(b => b.UpdatedAtUtc)
            .Select(b => new { b.Id, b.StateJson, b.UpdatedAtUtc })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return rows.ConvertAll(static r =>
        {
            var (rowCount, columnCount) = ReadDimensionsFromStateJson(r.StateJson);
            return new BoardSummary(r.Id, rowCount, columnCount, r.UpdatedAtUtc);
        });
    }

    public async Task<GameBoardRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Boards.AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken)
            .ConfigureAwait(false);

        return entity is null ? null : ToRecord(entity);
    }

    public async Task AddAsync(GameBoardRecord board, CancellationToken cancellationToken = default)
    {
        var entity = ToEntity(board);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        dbContext.Boards.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task UpdateAsync(GameBoardRecord board, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Boards.FirstOrDefaultAsync(b => b.Id == board.Id, cancellationToken)
            .ConfigureAwait(false);

        if (entity is null)
            throw new BoardNotFoundException(board.Id);

        entity.StateJson = SerializeBoard(board.Board);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Boards.FirstOrDefaultAsync(b => b.Id == id, cancellationToken)
            .ConfigureAwait(false);

        if (entity is null)
            return false;

        dbContext.Boards.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return true;
    }

    private static GameBoardRecord ToRecord(GameBoardEntity entity)
    {
        var cells = JsonSerializer.Deserialize<bool[][]>(entity.StateJson, JsonOptions)
            ?? throw new InvalidOperationException($"Board {entity.Id} has invalid stored state.");

        var board = Board.FromJagged(cells);
        return new GameBoardRecord { Id = entity.Id, Board = board };
    }

    private static GameBoardEntity ToEntity(GameBoardRecord record) =>
        new()
        {
            Id = record.Id,
            StateJson = SerializeBoard(record.Board),
            UpdatedAtUtc = DateTime.UtcNow
        };

    private static string SerializeBoard(Board board) =>
        JsonSerializer.Serialize(board.ToJagged(), JsonOptions);

    private static (int Rows, int Columns) ReadDimensionsFromStateJson(string stateJson)
    {
        using var doc = JsonDocument.Parse(stateJson);
        var root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("Invalid board state: expected a non-empty JSON array of rows.");
        }

        var rows = root.GetArrayLength();
        var firstRow = root[0];
        if (firstRow.ValueKind != JsonValueKind.Array || firstRow.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("Invalid board state: each row must be a non-empty JSON array.");
        }

        var columns = firstRow.GetArrayLength();
        return (rows, columns);
    }
}
