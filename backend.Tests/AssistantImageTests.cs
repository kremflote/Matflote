using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace DinnerPlanner.Api.Tests;

/// <summary>The app with outgoing image downloads answered by a fake photo server.</summary>
public class ImageServerFakeFactory : MatfloteFactory
{
    public static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xD9];
    public static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];

    public FakeHttpHandler Handler { get; } = new(request => request.RequestUri!.AbsolutePath switch
    {
        "/fish.jpg" => Bytes(Jpeg, "image/jpeg"),
        "/soup.png" => Bytes(Png, "image/png"),
        "/page.jpg" => Bytes("<html>Not a photo</html>"u8.ToArray(), "text/html"),
        "/lying.jpg" => Bytes("GIF89a, not a jpeg"u8.ToArray(), "image/jpeg"),
        "/huge.jpg" => Bytes(new byte[AssistantImageDownloader.MaxBytes + 1], "image/jpeg"),
        "/slow.jpg" => throw new TaskCanceledException("The request timed out."),
        _ => new HttpResponseMessage(HttpStatusCode.NotFound) { ReasonPhrase = "Not Found" },
    });

    private static HttpResponseMessage Bytes(byte[] bytes, string contentType)
    {
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new HttpResponseMessage(HttpStatusCode.OK) { Content = content };
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
            services.AddHttpClient<AssistantImageDownloader>().ConfigurePrimaryHttpMessageHandler(() => Handler));
    }
}

public class AssistantImageTests(ImageServerFakeFactory factory) : IClassFixture<ImageServerFakeFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private string RecipeImagesFolder => Path.Combine(factory.Directory, "images", "recipes");

    private static object Recipe(string name, string? imageUrl) =>
        new { name, portions = 2, imageUrl, tags = new[] { "Dinner" }, ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } };

    private Task<JsonElement> Document(JsonElement item) =>
        client.GetJson<JsonElement>($"/api/assistant/recipes/{item.GetProperty("id").GetInt32()}");

    private int StoredFiles() => Directory.Exists(RecipeImagesFolder) ? Directory.GetFiles(RecipeImagesFolder).Length : 0;

    [Fact]
    public async Task An_external_photo_is_downloaded_and_stored_not_linked()
    {
        var result = await client.Import(new { recipes = new[] { Recipe("IMG fish", "https://photos.example/fish.jpg?size=large") } });

        var item = result.Item("recipes", "IMG fish");
        var stored = item.GetProperty("imageUrl").GetString()!;
        Assert.StartsWith("/images/recipes/", stored);
        Assert.EndsWith(".jpg", stored);
        Assert.Equal(stored, (await Document(item)).GetProperty("imageUrl").GetString());

        // Served by MATFLOTE itself, byte for byte.
        var photo = await client.GetAsync(stored);
        await photo.EnsureStatus(HttpStatusCode.OK);
        Assert.Equal(ImageServerFakeFactory.Jpeg, await photo.Content.ReadAsByteArrayAsync());

        // Registered like an upload, so image clean-up knows it is in use.
        var report = await client.GetJson<JsonElement>("/api/maintenance/images/report");
        Assert.DoesNotContain(stored, report.GetRawText());
        // It has no thumbnail yet; Settings → Maintenance makes the missing ones.
        Assert.Contains(stored, (await client.GetStringAsync("/api/maintenance/images/missing-thumbnails")));
    }

    [Fact]
    public async Task A_stored_image_path_is_kept_and_an_empty_string_removes_the_photo()
    {
        var first = await client.Import(new { recipes = new[] { Recipe("IMG soup", "http://photos.example/soup.png") } });
        var document = await Document(first.Item("recipes", "IMG soup"));
        var stored = document.GetProperty("imageUrl").GetString()!;
        var filesBefore = StoredFiles();

        // Posting the document back unchanged keeps the photo and downloads nothing.
        var requestsBefore = factory.Handler.Requests.Count;
        using (var body = JsonDocument.Parse(document.GetRawText()))
        {
            await client.Import(new { onExistingRecipe = "update", recipes = new[] { body.RootElement } });
        }

        Assert.Equal(stored, (await Document(first.Item("recipes", "IMG soup"))).GetProperty("imageUrl").GetString());
        Assert.Equal(requestsBefore, factory.Handler.Requests.Count);
        Assert.Equal(filesBefore, StoredFiles());

        // Leaving imageUrl out on an update keeps the photo too.
        await client.Import(new { onExistingRecipe = "update", recipes = new[] { new { name = "IMG soup", portions = 3, tags = new[] { "Dinner" }, ingredients = Array.Empty<object>() } } });
        Assert.Equal(stored, (await Document(first.Item("recipes", "IMG soup"))).GetProperty("imageUrl").GetString());

        await client.Import(new { onExistingRecipe = "update", recipes = new[] { Recipe("IMG soup", "") } });
        Assert.False((await Document(first.Item("recipes", "IMG soup"))).TryGetProperty("imageUrl", out _));
    }

    [Fact]
    public async Task A_dry_run_checks_the_photo_but_stores_nothing_and_one_url_is_fetched_once()
    {
        var filesBefore = StoredFiles();
        var requestsBefore = factory.Handler.Requests.Count;

        var result = await client.Import(new
        {
            dryRun = true,
            recipes = new[] { Recipe("IMG dry a", "https://photos.example/fish.jpg"), Recipe("IMG dry b", "https://photos.example/fish.jpg") },
        });

        Assert.Equal("would_create", result.Item("recipes", "IMG dry a").Status());
        Assert.Equal(requestsBefore + 1, factory.Handler.Requests.Count);
        Assert.Equal(filesBefore, StoredFiles());
        Assert.Null((await client.Context()).FindRecipe("IMG dry a"));
    }

    [Theory]
    [InlineData("https://photos.example/page.jpg", "not a JPEG, PNG or WebP image")]
    [InlineData("https://photos.example/lying.jpg", "its content is not a image/jpeg image")]
    [InlineData("https://photos.example/huge.jpg", "the limit is 5 MB")]
    [InlineData("https://photos.example/missing.jpg", "the server answered 404")]
    [InlineData("https://photos.example/slow.jpg", "did not arrive within 15 seconds")]
    [InlineData("ftp://photos.example/fish.jpg", "must be an http(s) address")]
    [InlineData("file:///etc/passwd", "must be an http(s) address")]
    [InlineData("fish.jpg", "must be an http(s) address")]
    [InlineData("/images/recipes/not-there.jpg", "no stored image at that path")]
    public async Task Photos_that_cannot_be_used_reject_the_request_and_store_nothing(string imageUrl, string expected)
    {
        var name = $"IMG bad {Math.Abs(imageUrl.GetHashCode()) % 100000}";
        var filesBefore = StoredFiles();

        var result = await client.Import(new { recipes = new[] { Recipe(name, imageUrl) } }, HttpStatusCode.UnprocessableEntity);

        Assert.Contains(expected, result.AllErrors());
        Assert.Equal(filesBefore, StoredFiles());
        Assert.Null((await client.Context()).FindRecipe(name));
    }
}
