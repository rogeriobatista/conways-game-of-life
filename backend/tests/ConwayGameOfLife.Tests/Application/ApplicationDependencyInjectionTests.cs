using ConwayGameOfLife.Application;
using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Application.Services;
using ConwayGameOfLife.Domain.Simulation;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace ConwayGameOfLife.Tests.Application;

public sealed class ApplicationDependencyInjectionTests
{
    [Fact]
    public void AddApplication_RegistersCoreServices()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(Mock.Of<IGameBoardRepository>());
        services.AddSingleton(Mock.Of<IMeteorScoreRepository>());
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Game:MaxRows"] = "40",
                    ["Game:MaxColumns"] = "40",
                    ["Game:MaxAdvanceSteps"] = "100",
                    ["Game:MaxFinalStateAttempts"] = "500",
                    ["Game:DefaultFinalStateMaxAttempts"] = "50",
                    ["Game:DefaultLeaderboardTop"] = "5",
                })
            .Build();

        services.AddApplication(configuration);
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var sp = scope.ServiceProvider;

        sp.GetRequiredService<IGameEngine>().Should().BeOfType<GameEngine>();
        sp.GetRequiredService<IGameService>().Should().NotBeNull();
        sp.GetRequiredService<IMeteorScoreService>().Should().NotBeNull();
        sp.GetRequiredService<IValidator<CreateBoardCommand>>().Should().NotBeNull();
    }
}
