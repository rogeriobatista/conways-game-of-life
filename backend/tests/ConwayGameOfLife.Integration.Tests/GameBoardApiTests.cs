using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ConwayGameOfLife.Application.Boards;
using FluentAssertions;

namespace ConwayGameOfLife.Integration.Tests;

[Collection("ApiIntegration")]
public sealed class GameBoardApiTests
{
    private readonly HttpClient _client;

    public GameBoardApiTests(ConwayApiFactory factory) => _client = factory.Client;

    [Fact]
    public async Task ListBoards_Empty_ReturnsOk()
    {
        var response = await _client.GetAsync(new Uri("/api/game/boards", UriKind.Relative));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).ValueKind.Should().Be(JsonValueKind.Array);
    }

    [Fact]
    public async Task CreateBoard_RoundTrip()
    {
        var create = new CreateBoardCommand
        {
            Cells = new[] { new[] { true, false }, new[] { false, true } },
        };

        var created = await _client.PostAsJsonAsync(new Uri("/api/game/boards", UriKind.Relative), create);
        created.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var id = createdBody!.GetProperty("id").GetGuid();

        var state = await _client.GetFromJsonAsync<JsonElement>(new Uri($"/api/game/boards/{id}", UriKind.Relative));
        state.GetProperty("rows").GetInt32().Should().Be(2);
        state.GetProperty("columns").GetInt32().Should().Be(2);

        var next = await _client.GetAsync(new Uri($"/api/game/boards/{id}/next", UriKind.Relative));
        next.StatusCode.Should().Be(HttpStatusCode.OK);

        var advance = await _client.GetAsync(new Uri($"/api/game/boards/{id}/advance/2", UriKind.Relative));
        advance.StatusCode.Should().Be(HttpStatusCode.OK);

        var final = await _client.GetAsync(new Uri($"/api/game/boards/{id}/final?maxAttempts=20", UriKind.Relative));
        final.StatusCode.Should().Be(HttpStatusCode.OK);

        var replace = new CreateBoardCommand { Cells = new[] { new[] { false, false }, new[] { false, false } } };
        var put = await _client.PutAsJsonAsync(new Uri($"/api/game/boards/{id}", UriKind.Relative), replace);
        put.StatusCode.Should().Be(HttpStatusCode.OK);

        var delete = await _client.DeleteAsync(new Uri($"/api/game/boards/{id}", UriKind.Relative));
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var missing = await _client.GetAsync(new Uri($"/api/game/boards/{id}", UriKind.Relative));
        missing.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateBoard_InvalidBody_Returns400()
    {
        var response = await _client.PostAsJsonAsync(
            new Uri("/api/game/boards", UriKind.Relative),
            new CreateBoardCommand { Cells = null! });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Cells");
    }

    [Fact]
    public async Task GetBoard_UnknownId_Returns404()
    {
        var id = Guid.NewGuid();
        var response = await _client.GetAsync(new Uri($"/api/game/boards/{id}", UriKind.Relative));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Advance_InvalidSteps_Returns400()
    {
        var create = new CreateBoardCommand { Cells = new[] { new[] { true } } };
        var created = await _client.PostAsJsonAsync(new Uri("/api/game/boards", UriKind.Relative), create);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>())!.GetProperty("id").GetGuid();

        var response = await _client.GetAsync(new Uri($"/api/game/boards/{id}/advance/0", UriKind.Relative));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
