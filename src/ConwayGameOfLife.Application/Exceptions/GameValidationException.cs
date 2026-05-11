namespace ConwayGameOfLife.Application.Exceptions;

public sealed class GameValidationException(string message) : Exception(message);
