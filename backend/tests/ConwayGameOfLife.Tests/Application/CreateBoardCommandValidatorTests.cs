using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Validation;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Options;

namespace ConwayGameOfLife.Tests.Application;

public sealed class CreateBoardCommandValidatorTests
{
    private static CreateBoardCommandValidator CreateSut(GameLimitsOptions limits) =>
        new(Options.Create(limits));

    [Fact]
    public async Task Validate_FailsWhenCellsNull()
    {
        var sut = CreateSut(new GameLimitsOptions { MaxRows = 10, MaxColumns = 10 });
        var result = await sut.ValidateAsync(new CreateBoardCommand { Cells = null! });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Cells are required.");
    }

    [Fact]
    public async Task Validate_FailsWhenNoRows()
    {
        var sut = CreateSut(new GameLimitsOptions { MaxRows = 10, MaxColumns = 10 });
        var result = await sut.ValidateAsync(new CreateBoardCommand { Cells = [] });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "At least one row is required.");
    }

    [Fact]
    public async Task Validate_FailsWhenFirstRowIsEmpty()
    {
        var limits = new GameLimitsOptions { MaxRows = 10, MaxColumns = 10 };
        var sut = CreateSut(limits);
        var result = await sut.ValidateAsync(new CreateBoardCommand { Cells = new[] { Array.Empty<bool>() } });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == BoardGridLimits.UniformRowsMessage(limits));
    }

    [Fact]
    public async Task Validate_FailsWhenRowCountExceedsMax()
    {
        var limits = new GameLimitsOptions { MaxRows = 2, MaxColumns = 10 };
        var sut = CreateSut(limits);
        var cells = new[] { new[] { true }, new[] { true }, new[] { true } };
        var result = await sut.ValidateAsync(new CreateBoardCommand { Cells = cells });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == BoardGridLimits.RowCountExceededMessage(limits));
    }

    [Fact]
    public async Task Validate_FailsWhenColumnCountExceedsMax()
    {
        var limits = new GameLimitsOptions { MaxRows = 10, MaxColumns = 2 };
        var sut = CreateSut(limits);
        var cells = new[] { new[] { true, true, true } };
        var result = await sut.ValidateAsync(new CreateBoardCommand { Cells = cells });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == BoardGridLimits.ColumnCountPerRowExceededMessage(limits));
    }

    [Fact]
    public async Task Validate_FailsWhenRowLengthsNotUniform()
    {
        var limits = new GameLimitsOptions { MaxRows = 10, MaxColumns = 10 };
        var sut = CreateSut(limits);
        var cells = new[] { new[] { true, false }, new[] { true } };
        var result = await sut.ValidateAsync(new CreateBoardCommand { Cells = cells });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == BoardGridLimits.UniformRowsMessage(limits));
    }

    [Fact]
    public async Task Validate_SucceedsForValidGrid()
    {
        var sut = CreateSut(new GameLimitsOptions { MaxRows = 10, MaxColumns = 10 });
        var result = await sut.ValidateAsync(
            new CreateBoardCommand { Cells = new[] { new[] { true, false }, new[] { false, true } } });

        result.IsValid.Should().BeTrue();
    }
}
