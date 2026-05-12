using System.Text.Json;
using ConwayGameOfLife.Api.ExceptionHandling;
using ConwayGameOfLife.Application.Exceptions;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace ConwayGameOfLife.Tests.Api;

public sealed class GlobalExceptionHandlerTests
{
    private static async Task<(int Status, string Body)> InvokeHandlerAsync(Exception exception)
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var ctx = new DefaultHttpContext();
        ctx.Response.Body = new MemoryStream();

        await handler.TryHandleAsync(ctx, exception, CancellationToken.None).ConfigureAwait(false);

        ctx.Response.Body.Position = 0;
        using var reader = new StreamReader(ctx.Response.Body);
        var body = await reader.ReadToEndAsync().ConfigureAwait(false);
        return (ctx.Response.StatusCode, body);
    }

    [Fact]
    public async Task BoardNotFound_Returns404()
    {
        var id = Guid.NewGuid();
        var (status, body) = await InvokeHandlerAsync(new BoardNotFoundException(id));

        status.Should().Be(404);
        body.Should().Contain("board_not_found");
    }

    [Fact]
    public async Task FinalStateNotReached_Returns400()
    {
        var (status, body) = await InvokeHandlerAsync(new FinalStateNotReachedException(Guid.NewGuid(), 3));

        status.Should().Be(400);
        body.Should().Contain("final_state_not_reached");
    }

    [Fact]
    public async Task GameValidation_Returns400()
    {
        var (status, body) = await InvokeHandlerAsync(new GameValidationException("bad"));

        status.Should().Be(400);
        body.Should().Contain("validation_error").And.Contain("bad");
    }

    [Fact]
    public async Task FluentValidation_JoinsErrorMessages()
    {
        var failures = new List<ValidationFailure>
        {
            new("a", "first"),
            new("b", "second"),
        };
        var (status, body) = await InvokeHandlerAsync(new ValidationException(failures));

        status.Should().Be(400);
        body.Should().Contain("first").And.Contain("second");
    }

    [Fact]
    public async Task OperationCanceled_Returns408()
    {
        var (status, body) = await InvokeHandlerAsync(new OperationCanceledException());

        status.Should().Be(408);
        body.Should().Contain("cancelled");
    }

    [Fact]
    public async Task UnknownException_Returns500()
    {
        var (status, body) = await InvokeHandlerAsync(new InvalidOperationException("boom"));

        status.Should().Be(500);
        body.Should().Contain("server_error");
        JsonDocument.Parse(body).RootElement.GetProperty("message").GetString().Should().Be("An unexpected error occurred.");
    }
}
