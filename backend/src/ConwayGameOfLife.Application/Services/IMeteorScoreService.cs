using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Responses;

namespace ConwayGameOfLife.Application.Services;

public interface IMeteorScoreService
{
    Task<MeteorScoreResponse> RecordScoreAsync(CreateMeteorScoreCommand command, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MeteorScoreResponse>> ListTopScoresAsync(int top, CancellationToken cancellationToken = default);
}
