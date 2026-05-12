namespace ConwayGameOfLife.Infrastructure.Persistence;

public sealed class MeteorScoreEntity
{
    public Guid Id { get; set; }

    public int Score { get; set; }

    public int Locks { get; set; }

    public int PlacedCellTotal { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
