using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Application.Persistence.Records;

namespace ConwayGameOfLife.Application.Persistence.Repositories;

public interface IGameBoardRepository
{
    Task<IReadOnlyList<BoardSummary>> ListSummariesAsync(CancellationToken cancellationToken = default);

    Task<GameBoardRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(GameBoardRecord board, CancellationToken cancellationToken = default);

    Task UpdateAsync(GameBoardRecord board, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
