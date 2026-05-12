using ConwayGameOfLife.Application.MeteorScores;

namespace ConwayGameOfLife.Application.Persistence.Repositories;

public interface IMeteorScoreRepository
{
    Task<MeteorScore> AddAsync(int score, int locks, int placedCellTotal, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MeteorScore>> ListTopByScoreAsync(int take, CancellationToken cancellationToken = default);
}
