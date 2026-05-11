namespace ConwayGameOfLife.Infrastructure.Persistence;

public sealed class GameBoardEntity
{
    public Guid Id { get; set; }

    public string StateJson { get; set; } = string.Empty;

    public DateTime UpdatedAtUtc { get; set; }
}
