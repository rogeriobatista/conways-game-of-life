using ConwayGameOfLife.Application.Commands;
using FluentValidation;

namespace ConwayGameOfLife.Application.Validators;

public sealed class CreateMeteorScoreCommandValidator : AbstractValidator<CreateMeteorScoreCommand>
{
    public CreateMeteorScoreCommandValidator()
    {
        RuleFor(x => x.Score).InclusiveBetween(0, 10_000_000);
        RuleFor(x => x.Locks).InclusiveBetween(0, 1_000_000);
        RuleFor(x => x.PlacedCellTotal).InclusiveBetween(0, 50_000_000);
    }
}
