using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Validation;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace ConwayGameOfLife.Application.Boards;

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
                .WithMessage(BoardGridLimits.RowCountExceededMessage(limits));

            RuleFor(x => x.Cells!)
                .Must(HasUniformRowLengthsAndWithinColumnLimit!)
                .OverridePropertyName(nameof(CreateBoardCommand.Cells))
                .WithMessage(BoardGridLimits.UniformRowsMessage(limits));

            RuleFor(x => x.Cells!)
                .Must((_, rows) => rows.All(r => r!.Length <= limits.MaxColumns))
                .WithMessage(BoardGridLimits.ColumnCountPerRowExceededMessage(limits));
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
