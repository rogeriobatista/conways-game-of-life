using ConwayGameOfLife.Application;
using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Responses;
using Microsoft.AspNetCore.Mvc;

namespace ConwayGameOfLife.Api.Controllers;

[ApiController]
[Route("api/game/meteor-scores")]
public sealed class MeteorScoresController(IMeteorScoreService meteorScoreService) : ControllerBase
{
    /// <summary>Persists a finished Meteor shower session for the scoreboard.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(MeteorScoreResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MeteorScoreResponse>> RecordScore(
        [FromBody] CreateMeteorScoreCommand command,
        CancellationToken cancellationToken)
    {
        var created = await meteorScoreService.RecordScoreAsync(command, cancellationToken).ConfigureAwait(false);
        return Created($"/api/game/meteor-scores/{created.Id}", created);
    }

    /// <summary>Returns the top scores (highest first).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MeteorScoreResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MeteorScoreResponse>>> ListTop(
        [FromQuery] int? top,
        CancellationToken cancellationToken)
    {
        var list = await meteorScoreService.ListTopScoresAsync(top ?? 25, cancellationToken).ConfigureAwait(false);
        return Ok(list);
    }
}
