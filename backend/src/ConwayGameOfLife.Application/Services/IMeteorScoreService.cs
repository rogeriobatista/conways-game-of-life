using ConwayGameOfLife.Application.MeteorScores;

namespace ConwayGameOfLife.Application.Services;

public interface IMeteorScoreService
{
    Task<MeteorScore> RecordScoreAsync(CreateMeteorScoreCommand command, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MeteorScore>> ListTopScoresAsync(int top, CancellationToken cancellationToken = default);
}
