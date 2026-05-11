namespace ConwayGameOfLife.Application.Exceptions;

public sealed class BoardNotFoundException(Guid boardId)
    : Exception($"No board exists with id '{boardId}'.")
{
    public Guid BoardId { get; } = boardId;
}
