using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ConwayGameOfLife.Integration.Tests;

public sealed class ConwayApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"cgol_api_{Guid.NewGuid()}.db");
    private HttpClient? _client;

    /// <summary>Single client for the shared host (avoids repeated host bootstrap edge cases).</summary>
    public HttpClient Client => _client ??= CreateClient();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = $"Data Source={_dbPath}",
                });
        });
    }

    protected override void Dispose(bool disposing)
    {
        _client?.Dispose();
        base.Dispose(disposing);
        if (disposing)
            TryDelete(_dbPath);
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
