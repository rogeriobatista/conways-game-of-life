using ConwayGameOfLife.Application.Persistence;
using ConwayGameOfLife.Application.Responses;
using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Infrastructure.Persistence;

public sealed class MeteorScoreRepository(GameDbContext dbContext) : IMeteorScoreRepository
{
    public async Task<MeteorScoreResponse> AddAsync(int score, int locks, int placedCellTotal, CancellationToken cancellationToken = default)
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

        return ToResponse(entity);
    }

    public async Task<IReadOnlyList<MeteorScoreResponse>> ListTopByScoreAsync(int take, CancellationToken cancellationToken = default)
    {
        var capped = Math.Clamp(take, 1, 100);
        var rows = await dbContext.MeteorScores.AsNoTracking()
            .OrderByDescending(s => s.Score)
            .ThenByDescending(s => s.CreatedAtUtc)
            .Take(capped)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return rows.ConvertAll(ToResponse);
    }

    private static MeteorScoreResponse ToResponse(MeteorScoreEntity e) =>
        new(e.Id, e.Score, e.Locks, e.PlacedCellTotal, DateTime.SpecifyKind(e.CreatedAtUtc, DateTimeKind.Utc));
}
