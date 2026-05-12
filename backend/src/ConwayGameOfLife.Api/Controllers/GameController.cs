using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Services;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ConwayGameOfLife.Api.Controllers;

[ApiController]
[Route("api/game/boards")]
public sealed class GameController(IGameService gameService, IOptions<GameLimitsOptions> limitsOptions) : ControllerBase
{
    /// <summary>Lists all registered boards (most recently updated first). Cell data is omitted.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<BoardSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BoardSummaryResponse>>> ListBoards(CancellationToken cancellationToken)
    {
        var boards = await gameService.ListBoardsAsync(cancellationToken).ConfigureAwait(false);
        return Ok(boards);
    }

    /// <summary>Upload a new board; returns a unique identifier.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(BoardCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BoardCreatedResponse>> CreateBoard(
        [FromBody] CreateBoardCommand command,
        CancellationToken cancellationToken)
    {
        var result = await gameService.CreateBoardAsync(command, cancellationToken).ConfigureAwait(false);
        return Created($"/api/game/boards/{result.Id}", result);
    }

    /// <summary>Replaces the entire stored grid (same as uploading a new pattern while keeping the id).</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(BoardStateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BoardStateResponse>> ReplaceBoard(
        Guid id,
        [FromBody] CreateBoardCommand command,
        CancellationToken cancellationToken)
    {
        var state = await gameService.ReplaceBoardAsync(id, command, cancellationToken).ConfigureAwait(false);
        return Ok(state);
    }

    /// <summary>Deletes a board permanently.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBoard(Guid id, CancellationToken cancellationToken)
    {
        await gameService.DeleteBoardAsync(id, cancellationToken).ConfigureAwait(false);
        return NoContent();
    }

    /// <summary>Returns the current persisted state without evolving the board.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BoardStateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BoardStateResponse>> GetBoard(Guid id, CancellationToken cancellationToken)
    {
        var state = await gameService.GetBoardStateAsync(id, cancellationToken).ConfigureAwait(false);
        return Ok(state);
    }

    /// <summary>Computes and persists the next generation for the board.</summary>
    [HttpGet("{id:guid}/next")]
    [ProducesResponseType(typeof(BoardStateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BoardStateResponse>> Next(Guid id, CancellationToken cancellationToken)
    {
        var state = await gameService.GetNextGenerationAsync(id, cancellationToken).ConfigureAwait(false);
        return Ok(state);
    }

    /// <summary>Advances the board by the given number of generations.</summary>
    [HttpGet("{id:guid}/advance/{steps:int}")]
    [ProducesResponseType(typeof(BoardStateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BoardStateResponse>> Advance(Guid id, int steps, CancellationToken cancellationToken)
    {
        var state = await gameService.AdvanceAsync(id, steps, cancellationToken).ConfigureAwait(false);
        return Ok(state);
    }

    /// <summary>
    /// Advances until the board reaches a stable generation (unchanged after one step), or returns 400 if not reached within maxAttempts.
    /// </summary>
    [HttpGet("{id:guid}/final")]
    [ProducesResponseType(typeof(BoardStateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BoardStateResponse>> Final(
        Guid id,
        [FromQuery] int? maxAttempts,
        CancellationToken cancellationToken)
    {
        var resolved = maxAttempts ?? limitsOptions.Value.DefaultFinalStateMaxAttempts;
        var state = await gameService.GetFinalStableStateAsync(id, resolved, cancellationToken).ConfigureAwait(false);
        return Ok(state);
    }
}
