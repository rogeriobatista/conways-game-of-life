using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Responses;

namespace ConwayGameOfLife.Application;

public interface IGameService
{
    Task<BoardCreatedResponse> CreateBoardAsync(CreateBoardCommand command, CancellationToken cancellationToken = default);

    Task<BoardStateResponse> GetNextGenerationAsync(Guid boardId, CancellationToken cancellationToken = default);

    Task<BoardStateResponse> AdvanceAsync(Guid boardId, int steps, CancellationToken cancellationToken = default);

    Task<BoardStateResponse> GetFinalStableStateAsync(Guid boardId, int maxAttempts, CancellationToken cancellationToken = default);
}
