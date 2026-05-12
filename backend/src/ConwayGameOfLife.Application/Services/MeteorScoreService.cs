using ConwayGameOfLife.Application.MeteorScores;
using ConwayGameOfLife.Application.Persistence.Repositories;
using Microsoft.Extensions.Logging;

namespace ConwayGameOfLife.Application.Services;

public sealed class MeteorScoreService(
    IMeteorScoreRepository repository,
    ILogger<MeteorScoreService> logger) : IMeteorScoreService
{
    public async Task<MeteorScore> RecordScoreAsync(
        CreateMeteorScoreCommand command,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Recording Meteor score: Score={Score}, Locks={Locks}, PlacedCells={PlacedCells}.",
            command.Score,
            command.Locks,
            command.PlacedCellTotal);

        var row = await repository.AddAsync(
            command.Score,
            command.Locks,
            command.PlacedCellTotal,
            cancellationToken).ConfigureAwait(false);

        logger.LogDebug("Meteor score recorded with Id={Id}.", row.Id);
        return row;
    }

    public async Task<IReadOnlyList<MeteorScore>> ListTopScoresAsync(
        int top,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Listing top {Top} Meteor scores.", top);

        var scores = await repository.ListTopByScoreAsync(top, cancellationToken).ConfigureAwait(false);

        logger.LogDebug("Returned {Count} Meteor score(s).", scores.Count);
        return scores;
    }
}
