using ConwayGameOfLife.Application.MeteorScores;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ConwayGameOfLife.Api.Controllers;

[ApiController]
[Route("api/game/meteor-scores")]
public sealed class MeteorScoresController(
    IMeteorScoreService meteorScoreService,
    IOptions<GameLimitsOptions> limitsOptions) : ControllerBase
{
    /// <summary>Persists a finished Meteor shower session for the scoreboard.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(MeteorScore), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MeteorScore>> RecordScore(
        [FromBody] CreateMeteorScoreCommand command,
        CancellationToken cancellationToken)
    {
        var created = await meteorScoreService.RecordScoreAsync(command, cancellationToken).ConfigureAwait(false);
        return Created($"/api/game/meteor-scores/{created.Id}", created);
    }

    /// <summary>Returns the top scores (highest first). Defaults to <c>Game:DefaultLeaderboardTop</c> entries.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MeteorScore>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MeteorScore>>> ListTop(
        [FromQuery] int? top,
        CancellationToken cancellationToken)
    {
        var resolved = limitsOptions.Value.ResolveLeaderboardTop(top);
        var list = await meteorScoreService.ListTopScoresAsync(resolved, cancellationToken).ConfigureAwait(false);
        return Ok(list);
    }
}
