using ConwayGameOfLife.Domain.Entities;

namespace ConwayGameOfLife.Domain.Simulation;

public interface IGameEngine
{
    Board ComputeNext(Board board);
}
