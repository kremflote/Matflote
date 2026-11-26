// MATFLOTE: `dotnet backend.dll --healthcheck [url]` asks the running app for /health and exits 0 when it answers.
// Note: The aspnet base image has no curl or wget, so the Docker health check uses the app itself.

namespace DinnerPlanner.Api.Services;

public static class HealthCheckCommand
{
    public const string Argument = "--healthcheck";

    public const string DefaultUrl = "http://127.0.0.1:8080/health";

    /// <summary>Returns the process exit code: 0 when the app answers with a success status, 1 otherwise.</summary>
    public static async Task<int> RunAsync(string? url)
    {
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
        try
        {
            using var response = await client.GetAsync(url ?? DefaultUrl);
            if (response.IsSuccessStatusCode)
            {
                return 0;
            }

            Console.Error.WriteLine($"Health check got {(int)response.StatusCode} {response.ReasonPhrase}.");
            return 1;
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            Console.Error.WriteLine($"Health check failed: {exception.Message}");
            return 1;
        }
    }
}
