namespace ConwayGameOfLife.Application.MeteorScores;

public sealed record CreateMeteorScoreCommand(int Score, int Locks, int PlacedCellTotal);
