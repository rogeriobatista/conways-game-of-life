using ConwayGameOfLife.Application.Responses;

namespace ConwayGameOfLife.Application.Persistence;

public interface IGameBoardRepository
{
    Task<IReadOnlyList<BoardSummaryResponse>> ListSummariesAsync(CancellationToken cancellationToken = default);

    Task<GameBoardRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(GameBoardRecord board, CancellationToken cancellationToken = default);

    Task UpdateAsync(GameBoardRecord board, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
