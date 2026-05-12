using ConwayGameOfLife.Application.Boards;

namespace ConwayGameOfLife.Application.Services;

public interface IGameService
{
    Task<BoardStateResponse> GetBoardStateAsync(Guid boardId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<BoardSummary>> ListBoardsAsync(CancellationToken cancellationToken = default);

    Task<BoardCreatedResponse> CreateBoardAsync(CreateBoardCommand command, CancellationToken cancellationToken = default);

    Task<BoardStateResponse> GetNextGenerationAsync(Guid boardId, CancellationToken cancellationToken = default);

    Task<BoardStateResponse> AdvanceAsync(Guid boardId, int steps, CancellationToken cancellationToken = default);

    Task<BoardStateResponse> GetFinalStableStateAsync(Guid boardId, int maxAttempts, CancellationToken cancellationToken = default);

    Task DeleteBoardAsync(Guid boardId, CancellationToken cancellationToken = default);

    Task<BoardStateResponse> ReplaceBoardAsync(Guid boardId, CreateBoardCommand command, CancellationToken cancellationToken = default);
}
