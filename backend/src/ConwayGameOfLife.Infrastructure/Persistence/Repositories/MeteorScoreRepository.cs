using ConwayGameOfLife.Application.MeteorScores;
using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Infrastructure.Persistence.Repositories;

public sealed class MeteorScoreRepository(GameDbContext dbContext) : IMeteorScoreRepository
{
    public async Task<MeteorScore> AddAsync(int score, int locks, int placedCellTotal, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var entity = new MeteorScoreEntity
        {
            Id = Guid.NewGuid(),
            Score = score,
            Locks = locks,
            PlacedCellTotal = placedCellTotal,
            CreatedAtUtc = now,
        };

        dbContext.MeteorScores.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return ToMeteorScore(entity);
    }

    public async Task<IReadOnlyList<MeteorScore>> ListTopByScoreAsync(int take, CancellationToken cancellationToken = default)
    {
        var capped = Math.Clamp(take, 1, 100);
        var rows = await dbContext.MeteorScores.AsNoTracking()
            .OrderByDescending(s => s.Score)
            .ThenByDescending(s => s.CreatedAtUtc)
            .Take(capped)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return rows.ConvertAll(ToMeteorScore);
    }

    private static MeteorScore ToMeteorScore(MeteorScoreEntity e) =>
        new(e.Id, e.Score, e.Locks, e.PlacedCellTotal, DateTime.SpecifyKind(e.CreatedAtUtc, DateTimeKind.Utc));
}
