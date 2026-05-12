namespace ConwayGameOfLife.Application.Persistence;

public interface IMeteorScoreRepository
{
    Task<MeteorScoreEntry> AddAsync(int score, int locks, int placedCellTotal, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MeteorScoreEntry>> ListTopByScoreAsync(int take, CancellationToken cancellationToken = default);
}
