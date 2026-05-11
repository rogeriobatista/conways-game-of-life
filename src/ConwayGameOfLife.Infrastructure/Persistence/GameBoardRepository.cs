using System.Text.Json;
using ConwayGameOfLife.Application.Persistence;
using ConwayGameOfLife.Domain;
using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Infrastructure.Persistence;

public sealed class GameBoardRepository(GameDbContext dbContext) : IGameBoardRepository
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

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
        {
            throw new InvalidOperationException(
                $"Cannot update board '{board.Id}' because it does not exist in the database.");
        }

        entity.StateJson = SerializeBoard(board.Board);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
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
}
