using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ConwayGameOfLife.Application.MeteorScores;
using FluentAssertions;

namespace ConwayGameOfLife.Integration.Tests;

[Collection("ApiIntegration")]
public sealed class MeteorScoresApiTests
{
    private readonly HttpClient _client;

    public MeteorScoresApiTests(ConwayApiFactory factory) => _client = factory.Client;

    [Fact]
    public async Task RecordScore_ThenList_ReturnsScore()
    {
        var cmd = new CreateMeteorScoreCommand(1200, 3, 400);
        var post = await _client.PostAsJsonAsync(new Uri("/api/game/meteor-scores", UriKind.Relative), cmd);
        post.StatusCode.Should().Be(HttpStatusCode.Created);

        var list = await _client.GetFromJsonAsync<JsonElement>(new Uri("/api/game/meteor-scores?top=5", UriKind.Relative));
        list.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task RecordScore_Invalid_Returns400()
    {
        var cmd = new CreateMeteorScoreCommand(-1, 0, 0);
        var post = await _client.PostAsJsonAsync(new Uri("/api/game/meteor-scores", UriKind.Relative), cmd);

        post.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await post.Content.ReadAsStringAsync();
        body.Should().MatchRegex("validation_error|errors|Score");
    }
}
