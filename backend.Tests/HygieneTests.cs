using System.Net;
using System.Net.Http.Headers;
using System.Text;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT S1 and S2: CORS only for the dev server, and stored tokens only go to the stored base URL.</summary>
public class HygieneTests
{
    private static HttpRequestMessage Preflight() => new(HttpMethod.Options, "/api/recipes")
    {
        Headers =
        {
            { "Origin", "https://elsewhere.example" },
            { "Access-Control-Request-Method", "DELETE" },
        },
    };

    [Fact]
    public async Task Outside_Development_the_api_allows_no_other_origin()
    {
        using var factory = new MatfloteFactory();
        var client = factory.CreateClient();

        var response = await client.SendAsync(Preflight());

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task In_Development_the_dev_server_may_call_the_api_from_another_origin()
    {
        using var factory = new MatfloteFactory();
        var client = factory.WithWebHostBuilder(builder => builder.UseEnvironment("Development")).CreateClient();

        var response = await client.SendAsync(Preflight());

        Assert.Equal("*", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    private sealed class Outgoing
    {
        public List<(Uri Uri, AuthenticationHeaderValue? Authorization)> Requests { get; } = [];

        public FakeHttpHandler Handler(string json) => new(request =>
        {
            lock (Requests)
            {
                Requests.Add((request.RequestUri!, request.Headers.Authorization));
            }

            return FakeHttpHandler.Json(json);
        });
    }

    private static HttpClient Client(MatfloteFactory factory, Outgoing outgoing) =>
        factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddHttpClient<VikunjaShoppingListExporter>().ConfigurePrimaryHttpMessageHandler(() => outgoing.Handler("""{"id":3,"title":"Groceries"}"""));
            services.AddHttpClient<KassalappProductLookupService>().ConfigurePrimaryHttpMessageHandler(() => outgoing.Handler("""{"data":{}}"""));
        })).CreateClient();

    private static async Task SaveSecrets(HttpClient client)
    {
        var response = await client.PutJson("/api/app-settings", new
        {
            shoppingListExport = new
            {
                provider = "Vikunja",
                taskMode = "SingleTask",
                vikunja = new { baseUrl = "https://vikunja.example/", projectId = 3, apiToken = "stored-vikunja-token" },
            },
            externalIntegrations = new
            {
                kassalapp = new { baseUrl = "https://kassal.example/api/v1", apiKey = "stored-kassalapp-key" },
                helsedirektoratet = new { baseUrl = "https://hdir.example", subscriptionKey = (string?)null },
            },
        });
        await response.EnsureStatus(HttpStatusCode.OK);
    }

    private static object VikunjaTest(string baseUrl, string? apiToken) => new
    {
        provider = "Vikunja",
        taskMode = "SingleTask",
        vikunja = new { baseUrl, projectId = 3, apiToken },
    };

    [Fact]
    public async Task Testing_Vikunja_with_the_saved_base_URL_uses_the_saved_token()
    {
        using var factory = new MatfloteFactory();
        var outgoing = new Outgoing();
        var client = Client(factory, outgoing);
        await SaveSecrets(client);

        var response = await client.PostJson("/api/app-settings/test-shopping-list-export", VikunjaTest("https://VIKUNJA.example", null));

        await response.EnsureStatus(HttpStatusCode.OK);
        Assert.NotEmpty(outgoing.Requests);
        Assert.All(outgoing.Requests, request =>
        {
            Assert.Equal("vikunja.example", request.Uri.Host);
            Assert.Equal("stored-vikunja-token", request.Authorization?.Parameter);
        });
    }

    [Fact]
    public async Task Testing_Vikunja_with_another_base_URL_needs_a_token_in_the_request()
    {
        using var factory = new MatfloteFactory();
        var outgoing = new Outgoing();
        var client = Client(factory, outgoing);
        await SaveSecrets(client);

        var refused = await client.PostJson("/api/app-settings/test-shopping-list-export", VikunjaTest("http://127.0.0.1:9999", null));
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Empty(outgoing.Requests);

        var withToken = await client.PostJson("/api/app-settings/test-shopping-list-export", VikunjaTest("http://127.0.0.1:9999", "typed-token"));
        await withToken.EnsureStatus(HttpStatusCode.OK);
        Assert.All(outgoing.Requests, request => Assert.Equal("typed-token", request.Authorization?.Parameter));
    }

    [Fact]
    public async Task Testing_Kassalapp_uses_the_saved_key_only_for_the_saved_base_URL()
    {
        using var factory = new MatfloteFactory();
        var outgoing = new Outgoing();
        var client = Client(factory, outgoing);
        await SaveSecrets(client);

        await (await client.PostJson("/api/app-settings/test-kassalapp", new { baseUrl = "https://kassal.example/api/v1/", apiKey = (string?)null }))
            .EnsureStatus(HttpStatusCode.OK);
        await (await client.PostJson("/api/app-settings/test-kassalapp", new { baseUrl = "", apiKey = (string?)null }))
            .EnsureStatus(HttpStatusCode.OK);
        Assert.Equal(2, outgoing.Requests.Count);
        Assert.All(outgoing.Requests, request =>
        {
            Assert.Equal("kassal.example", request.Uri.Host);
            Assert.Equal("stored-kassalapp-key", request.Authorization?.Parameter);
        });

        var refused = await client.PostJson("/api/app-settings/test-kassalapp", new { baseUrl = "http://127.0.0.1:9999", apiKey = (string?)null });
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal(2, outgoing.Requests.Count);
    }
}
