using ConwayGameOfLife.Application.Persistence.Models;
using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Infrastructure.Persistence.Repositories;

public sealed class MeteorScoreRepository(GameDbContext dbContext) : IMeteorScoreRepository
{
    public async Task<MeteorScoreEntry> AddAsync(int score, int locks, int placedCellTotal, CancellationToken cancellationToken = default)
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

        return ToEntry(entity);
    }

    public async Task<IReadOnlyList<MeteorScoreEntry>> ListTopByScoreAsync(int take, CancellationToken cancellationToken = default)
    {
        var capped = Math.Clamp(take, 1, 100);
        var rows = await dbContext.MeteorScores.AsNoTracking()
            .OrderByDescending(s => s.Score)
            .ThenByDescending(s => s.CreatedAtUtc)
            .Take(capped)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return rows.ConvertAll(ToEntry);
    }

    private static MeteorScoreEntry ToEntry(MeteorScoreEntity e) =>
        new(e.Id, e.Score, e.Locks, e.PlacedCellTotal, DateTime.SpecifyKind(e.CreatedAtUtc, DateTimeKind.Utc));
}
