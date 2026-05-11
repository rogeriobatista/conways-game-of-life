using ConwayGameOfLife.Application.Commands;
using ConwayGameOfLife.Application.Options;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace ConwayGameOfLife.Application.Validators;

public sealed class CreateBoardCommandValidator : AbstractValidator<CreateBoardCommand>
{
    public CreateBoardCommandValidator(IOptions<GameLimitsOptions> limitsOptions)
    {
        var limits = limitsOptions.Value;

        RuleFor(x => x.Cells)
            .NotNull()
            .WithMessage("Cells are required.");

        When(x => x.Cells != null, () =>
        {
            RuleFor(x => x.Cells!.Length)
                .GreaterThanOrEqualTo(1)
                .WithMessage("At least one row is required.");

            RuleFor(x => x.Cells!)
                .Must(rows => rows.All(r => r != null))
                .WithMessage("Rows cannot be null.");

            RuleFor(x => x.Cells!)
                .Must(rows => rows.Length <= limits.MaxRows)
                .WithMessage($"Row count cannot exceed {limits.MaxRows}.");

            RuleFor(x => x.Cells!)
                .Must(HasUniformRowLengthsAndWithinColumnLimit!)
                .OverridePropertyName(nameof(CreateBoardCommand.Cells))
                .WithMessage(
                    $"All rows must have the same number of columns, between 1 and {limits.MaxColumns}, with no null rows.");

            RuleFor(x => x.Cells!)
                .Must((_, rows) => rows.All(r => r!.Length <= limits.MaxColumns))
                .WithMessage($"Column count cannot exceed {limits.MaxColumns}.");
        });
    }

    private static bool HasUniformRowLengthsAndWithinColumnLimit(bool[][] rows)
    {
        if (rows.Length == 0)
            return false;

        var first = rows[0];
        if (first is null || first.Length < 1)
            return false;

        var len = first.Length;
        return rows.All(r => r != null && r.Length == len);
    }
}
