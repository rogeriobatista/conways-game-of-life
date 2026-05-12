using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Infrastructure.Persistence;
using ConwayGameOfLife.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ConwayGameOfLife.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured. See appsettings.json.");

        services.AddDbContext<GameDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddScoped<IGameBoardRepository, GameBoardRepository>();
        services.AddScoped<IMeteorScoreRepository, MeteorScoreRepository>();

        return services;
    }
}
