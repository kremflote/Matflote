using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace DinnerPlanner.Api.Tests;

/// <summary>
/// Runs the real app in memory against its own SQLite file in a fresh temporary folder.
/// Used as a class fixture, so each test class gets its own database.
/// </summary>
public class MatfloteFactory : WebApplicationFactory<Program>
{
    public static readonly JsonSerializerOptions Json = CreateJsonOptions();

    private string? directory;

    /// <summary>The folder that holds the database file and the image storage. A new temporary folder by default.</summary>
    public string Directory
    {
        get => directory ??= CreateTempDirectory();
        init => directory = value;
    }

    /// <summary>Whether disposing the factory deletes <see cref="Directory"/>.</summary>
    public bool DeleteDirectoryOnDispose { get; init; } = true;

    public string DatabasePath => Path.Combine(Directory, "matflote-test.db");

    public string ConnectionString => $"Data Source={DatabasePath}";

    public static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "matflote-tests", Guid.NewGuid().ToString("N"));
        System.IO.Directory.CreateDirectory(path);
        return path;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DinnerPlanner"] = ConnectionString,
                ["ImageStorage:RootPath"] = Path.Combine(Directory, "images"),
                ["Logging:LogLevel:Default"] = "Warning",
                ["Logging:LogLevel:Microsoft.EntityFrameworkCore"] = "Warning",
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (!disposing || !DeleteDirectoryOnDispose || directory is null)
        {
            return;
        }

        SqliteConnection.ClearAllPools();
        try
        {
            System.IO.Directory.Delete(directory, recursive: true);
        }
        catch (IOException)
        {
            // A leftover temp folder is harmless.
        }
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}

public static class HttpTestExtensions
{
    public static Task<HttpResponseMessage> PostJson(this HttpClient client, string url, object body) =>
        client.PostAsJsonAsync(url, body, MatfloteFactory.Json);

    public static Task<HttpResponseMessage> PutJson(this HttpClient client, string url, object body) =>
        client.PutAsJsonAsync(url, body, MatfloteFactory.Json);

    public static async Task<T> Read<T>(this HttpResponseMessage response)
    {
        var value = await response.Content.ReadFromJsonAsync<T>(MatfloteFactory.Json);
        return value ?? throw new InvalidOperationException("The response body was empty.");
    }

    public static async Task<JsonElement> ReadJson(this HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>(MatfloteFactory.Json)).Clone();

    public static async Task<T> GetJson<T>(this HttpClient client, string url)
    {
        var response = await client.GetAsync(url);
        await response.EnsureStatus(System.Net.HttpStatusCode.OK);
        return await response.Read<T>();
    }

    /// <summary>Asserts the status code and shows the body when it does not match.</summary>
    public static async Task EnsureStatus(this HttpResponseMessage response, System.Net.HttpStatusCode expected)
    {
        if (response.StatusCode != expected)
        {
            var body = await response.Content.ReadAsStringAsync();
            Assert.Fail($"Expected {(int)expected} {expected} from {response.RequestMessage?.Method} {response.RequestMessage?.RequestUri}, got {(int)response.StatusCode} {response.StatusCode}: {body}");
        }
    }
}
