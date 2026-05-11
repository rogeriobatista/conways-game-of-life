using System.Net;
using System.Net.Mime;
using System.Text.Json;
using ConwayGameOfLife.Application.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;

namespace ConwayGameOfLife.Api.ExceptionHandling;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Request failed: {Path}", httpContext.Request.Path);

        var (statusCode, body) = MapException(exception);

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = MediaTypeNames.Application.Json;

        await httpContext.Response
            .WriteAsync(JsonSerializer.Serialize(body, JsonSerializerOptions), cancellationToken)
            .ConfigureAwait(false);

        return true;
    }

    private static (int StatusCode, ErrorResponse Body) MapException(Exception exception)
    {
        return exception switch
        {
            BoardNotFoundException ex => (
                (int)HttpStatusCode.NotFound,
                new ErrorResponse(
                    "board_not_found",
                    ex.Message)),

            FinalStateNotReachedException ex => (
                (int)HttpStatusCode.BadRequest,
                new ErrorResponse(
                    "final_state_not_reached",
                    ex.Message)),

            GameValidationException ex => (
                (int)HttpStatusCode.BadRequest,
                new ErrorResponse(
                    "validation_error",
                    ex.Message)),

            ValidationException ex => (
                (int)HttpStatusCode.BadRequest,
                new ErrorResponse(
                    "validation_error",
                    string.Join(" ", ex.Errors.Select(e => e.ErrorMessage)))),

            OperationCanceledException => (
                (int)HttpStatusCode.RequestTimeout,
                new ErrorResponse("cancelled", "The request was cancelled.")),

            _ => (
                (int)HttpStatusCode.InternalServerError,
                new ErrorResponse("server_error", "An unexpected error occurred."))
        };
    }

    private sealed record ErrorResponse(string Code, string Message);
}
