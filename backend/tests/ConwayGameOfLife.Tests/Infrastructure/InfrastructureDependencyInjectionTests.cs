using ConwayGameOfLife.Application.Persistence.Repositories;
using ConwayGameOfLife.Infrastructure;
using ConwayGameOfLife.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ConwayGameOfLife.Tests.Infrastructure;

public sealed class InfrastructureDependencyInjectionTests
{
    [Fact]
    public void AddInfrastructure_ThrowsWhenConnectionStringMissing()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().Build();

        var act = () => services.AddInfrastructure(configuration);

        act.Should().Throw<InvalidOperationException>().WithMessage("*DefaultConnection*");
    }

    [Fact]
    public void AddInfrastructure_RegistersDbContextAndRepositories()
    {
        var dbPath = Path.Combine(Path.GetTempPath(), $"cgol_di_{Guid.NewGuid()}.db");
        try
        {
            var services = new ServiceCollection();
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(
                    new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbPath}" })
                .Build();

            services.AddInfrastructure(configuration);
            using var provider = services.BuildServiceProvider();

            using var scope = provider.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<GameDbContext>();
            ctx.Database.Migrate();

            scope.ServiceProvider.GetRequiredService<IGameBoardRepository>().Should().NotBeNull();
            scope.ServiceProvider.GetRequiredService<IMeteorScoreRepository>().Should().NotBeNull();
        }
        finally
        {
            TryDelete(dbPath);
        }
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
            /* best effort */
        }
    }
}
