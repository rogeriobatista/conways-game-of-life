using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Persistence;
using ConwayGameOfLife.Application.Responses;

namespace ConwayGameOfLife.Application;

public sealed class MeteorScoreService(IMeteorScoreRepository repository) : IMeteorScoreService
{
    public Task<MeteorScoreResponse> RecordScoreAsync(CreateMeteorScoreCommand command, CancellationToken cancellationToken = default) =>
        repository.AddAsync(command.Score, command.Locks, command.PlacedCellTotal, cancellationToken);

    public Task<IReadOnlyList<MeteorScoreResponse>> ListTopScoresAsync(int top, CancellationToken cancellationToken = default) =>
        repository.ListTopByScoreAsync(top, cancellationToken);
}
