using System.Net;
using Microsoft.AspNetCore.Hosting;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT S1: CORS only for the dev server.</summary>
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
}
