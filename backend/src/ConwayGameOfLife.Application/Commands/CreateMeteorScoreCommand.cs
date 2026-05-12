namespace ConwayGameOfLife.Application.Commands;

public sealed record CreateMeteorScoreCommand(int Score, int Locks, int PlacedCellTotal);
