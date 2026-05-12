using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Persistence;
using ConwayGameOfLife.Application.Responses;
using Microsoft.Extensions.Logging;

namespace ConwayGameOfLife.Application.Services;

public sealed class MeteorScoreService(
    IMeteorScoreRepository repository,
    ILogger<MeteorScoreService> logger) : IMeteorScoreService
{
    public async Task<MeteorScoreResponse> RecordScoreAsync(
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
        return ToResponse(row);
    }

    public async Task<IReadOnlyList<MeteorScoreResponse>> ListTopScoresAsync(
        int top,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Listing top {Top} Meteor scores.", top);

        var scores = await repository.ListTopByScoreAsync(top, cancellationToken).ConfigureAwait(false);

        logger.LogDebug("Returned {Count} Meteor score(s).", scores.Count);
        return scores.Select(ToResponse).ToList();
    }

    private static MeteorScoreResponse ToResponse(MeteorScoreEntry e) =>
        new(e.Id, e.Score, e.Locks, e.PlacedCellTotal, e.CreatedAtUtc);
}
