using System.Net;
using System.Net.Sockets;
using DinnerPlanner.Api.Services;

namespace DinnerPlanner.Api.Tests;

/// <summary>The Docker health check runs <c>dotnet backend.dll --healthcheck</c> against the running app.</summary>
public class HealthCheckCommandTests
{
    private static int FreePort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        return ((IPEndPoint)listener.LocalEndpoint).Port;
    }

    [Fact]
    public async Task Succeeds_against_a_running_app_and_fails_on_an_error_status()
    {
        var port = FreePort();
        using var factory = new MatfloteFactory();
        factory.UseKestrel(port);
        factory.StartServer();

        Assert.Equal(0, await HealthCheckCommand.RunAsync($"http://127.0.0.1:{port}/health"));
        Assert.Equal(1, await HealthCheckCommand.RunAsync($"http://127.0.0.1:{port}/api/does-not-exist"));
    }

    [Fact]
    public async Task Fails_when_nothing_answers()
    {
        Assert.Equal(1, await HealthCheckCommand.RunAsync($"http://127.0.0.1:{FreePort()}/health"));
    }
}
