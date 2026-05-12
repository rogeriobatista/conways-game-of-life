using ConwayGameOfLife.Application.Options;
using ConwayGameOfLife.Application.Services;
using ConwayGameOfLife.Application.Boards;
using ConwayGameOfLife.Domain.Simulation;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ConwayGameOfLife.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<GameLimitsOptions>(configuration.GetSection(GameLimitsOptions.SectionName));
        services.AddScoped<IGameEngine, GameEngine>();
        services.AddScoped<IGameService, GameService>();
        services.AddScoped<IMeteorScoreService, MeteorScoreService>();
        services.AddValidatorsFromAssemblyContaining<CreateBoardCommandValidator>();

        return services;
    }
}
