namespace ConwayGameOfLife.Domain;

public interface IGameEngine
{
    Board ComputeNext(Board board);
}
