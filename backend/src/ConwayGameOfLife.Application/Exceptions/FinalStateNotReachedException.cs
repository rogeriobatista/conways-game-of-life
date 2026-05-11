namespace ConwayGameOfLife.Application.Exceptions;

public sealed class FinalStateNotReachedException(Guid boardId, int maxAttempts)
    : Exception(
        $"Board '{boardId}' did not reach a stable state within {maxAttempts} generation step(s). " +
        "Oscillators and other non-stable patterns may require a higher limit.")
{
    public Guid BoardId { get; } = boardId;

    public int MaxAttempts { get; } = maxAttempts;
}
