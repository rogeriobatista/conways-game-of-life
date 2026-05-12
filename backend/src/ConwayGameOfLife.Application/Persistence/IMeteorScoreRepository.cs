using ConwayGameOfLife.Application.Responses;

namespace ConwayGameOfLife.Application.Persistence;

public interface IMeteorScoreRepository
{
    Task<MeteorScoreResponse> AddAsync(int score, int locks, int placedCellTotal, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MeteorScoreResponse>> ListTopByScoreAsync(int take, CancellationToken cancellationToken = default);
}
