using System.Net;
using System.Net.Http.Headers;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class ImagesApiTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    // A valid 1x1 JPEG is not needed: the API stores bytes and never decodes them.
    private static readonly byte[] FakeJpeg = [0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3, 4, 0xFF, 0xD9];

    private readonly HttpClient client = factory.CreateClient();

    private string ImagesRoot => Path.Combine(factory.Directory, "images");

    private static ByteArrayContent File(byte[] bytes)
    {
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        return content;
    }

    private async Task<ImageUploadDto> Upload(string folder, bool withThumbnail)
    {
        using var form = new MultipartFormDataContent
        {
            { File(FakeJpeg), "file", "photo.jpg" },
            { new StringContent(folder), "folder" },
        };
        if (withThumbnail)
        {
            form.Add(File(FakeJpeg), "thumbnail", "photo-thumb.jpg");
        }

        var response = await client.PostAsync("/api/imageuploads", form);
        await response.EnsureStatus(HttpStatusCode.OK);
        return await response.Read<ImageUploadDto>();
    }

    private async Task<HttpResponseMessage> AttachThumbnail(string imageUrl)
    {
        using var form = new MultipartFormDataContent
        {
            { new StringContent(imageUrl), "imageUrl" },
            { File(FakeJpeg), "thumbnail", "thumb.jpg" },
        };
        return await client.PostAsync("/api/imageuploads/thumbnail", form);
    }

    private Task<ImagesWithoutThumbnailsDto> Missing() =>
        client.GetJson<ImagesWithoutThumbnailsDto>("/api/maintenance/images/missing-thumbnails");

    private async Task<RecipeDto> RecipeWithImage(string name, string imageUrl)
    {
        var salt = await CreateIngredient(client, $"{name} salt", "Spice");
        var response = await client.PostJson("/api/recipes", new
        {
            name,
            imageUrl,
            description = (string?)null,
            instructions = (string?)null,
            portions = 1,
            ingredients = new[] { Line(salt.IngredientId, 5) },
            tags = Array.Empty<string>(),
            components = Array.Empty<object>(),
        });
        await response.EnsureStatus(HttpStatusCode.Created);
        return await response.Read<RecipeDto>();
    }

    [Fact]
    public async Task Images_are_cached_by_browsers_for_a_year()
    {
        var response = await client.GetAsync("/images/placeholders/recipe-photo-placeholder.png");

        await response.EnsureStatus(HttpStatusCode.OK);
        Assert.Equal("public, max-age=31536000, immutable", response.Headers.CacheControl!.ToString());
    }

    [Fact]
    public async Task An_upload_with_a_thumbnail_returns_both_and_the_lists_carry_the_thumbnail()
    {
        var upload = await Upload("recipes", withThumbnail: true);

        Assert.Matches(@"^/images/recipes/[0-9a-f]{32}\.jpg$", upload.Url);
        Assert.Matches(@"^/images/recipes/[0-9a-f]{32}\.thumb\.jpg$", upload.ThumbnailUrl!);
        await (await client.GetAsync(upload.ThumbnailUrl)).EnsureStatus(HttpStatusCode.OK);

        var recipe = await RecipeWithImage("IMG with thumb", upload.Url);
        Assert.Equal(upload.ThumbnailUrl, recipe.ThumbnailUrl);
        var listed = (await client.GetJson<List<RecipeDto>>("/api/recipes")).Single(item => item.RecipeId == recipe.RecipeId);
        Assert.Equal(upload.ThumbnailUrl, listed.ThumbnailUrl);
    }

    [Fact]
    public async Task An_upload_without_a_thumbnail_has_none()
    {
        var upload = await Upload("ingredients", withThumbnail: false);

        Assert.Null(upload.ThumbnailUrl);
        var recipe = await RecipeWithImage("IMG no thumb", upload.Url);
        Assert.Null(recipe.ThumbnailUrl);
    }

    [Fact]
    public async Task Missing_thumbnails_are_found_from_the_urls_in_use_and_registered_when_added()
    {
        // Like a package import: a file in storage, used by a recipe, with no UploadedImages row.
        Directory.CreateDirectory(Path.Combine(ImagesRoot, "recipes"));
        await System.IO.File.WriteAllBytesAsync(Path.Combine(ImagesRoot, "recipes", "imported.jpg"), FakeJpeg);
        var recipe = await RecipeWithImage("IMG imported", "/images/recipes/imported.jpg");
        // A URL to a file that is not there is not offered.
        await RecipeWithImage("IMG gone", "/images/recipes/gone.jpg");

        var missing = await Missing();
        Assert.Contains("/images/recipes/imported.jpg", missing.ImageUrls);
        Assert.DoesNotContain("/images/recipes/gone.jpg", missing.ImageUrls);

        var etagBefore = (await client.GetAsync("/api/recipes")).Headers.ETag;
        var attach = await AttachThumbnail("/images/recipes/imported.jpg");
        await attach.EnsureStatus(HttpStatusCode.OK);
        var attached = await attach.Read<ImageUploadDto>();
        Assert.Matches(@"^/images/recipes/imported-[0-9a-f]{8}\.thumb\.jpg$", attached.ThumbnailUrl!);

        Assert.DoesNotContain("/images/recipes/imported.jpg", (await Missing()).ImageUrls);
        Assert.NotEqual(etagBefore, (await client.GetAsync("/api/recipes")).Headers.ETag);
        var reloaded = await client.GetJson<RecipeDto>($"/api/recipes/{recipe.RecipeId}");
        Assert.Equal(attached.ThumbnailUrl, reloaded.ThumbnailUrl);

        // Making it again replaces the old thumbnail file.
        var again = await (await AttachThumbnail("/images/recipes/imported.jpg")).Read<ImageUploadDto>();
        Assert.NotEqual(attached.ThumbnailUrl, again.ThumbnailUrl);
        Assert.False(System.IO.File.Exists(Path.Combine(ImagesRoot, attached.ThumbnailUrl!["/images/".Length..])));

        // The thumbnail belongs to a tracked image, so the cleanup report leaves it alone.
        var report = await client.GetJson<ImageCleanupReportDto>("/api/maintenance/images/report");
        Assert.DoesNotContain(report.UntrackedImageFiles, file => file.PublicUrl == again.ThumbnailUrl);
    }

    [Fact]
    public async Task Cleanup_removes_an_unused_image_together_with_its_thumbnail()
    {
        var upload = await Upload("general", withThumbnail: true);

        var cleanup = await client.PostAsync("/api/maintenance/images/cleanup", null);
        await cleanup.EnsureStatus(HttpStatusCode.OK);

        Assert.False(System.IO.File.Exists(Path.Combine(ImagesRoot, upload.Url["/images/".Length..])));
        Assert.False(System.IO.File.Exists(Path.Combine(ImagesRoot, upload.ThumbnailUrl!["/images/".Length..])));
    }

    [Theory]
    [InlineData("/images/recipes/nope.jpg", HttpStatusCode.NotFound)]
    [InlineData("/images/../matflote-test.db", HttpStatusCode.NotFound)]
    [InlineData("https://example.com/a.jpg", HttpStatusCode.NotFound)]
    public async Task A_thumbnail_needs_an_image_in_storage(string imageUrl, HttpStatusCode expected)
    {
        await (await AttachThumbnail(imageUrl)).EnsureStatus(expected);
    }

    [Fact]
    public async Task A_thumbnail_of_a_thumbnail_is_refused()
    {
        var upload = await Upload("recipes", withThumbnail: true);

        await (await AttachThumbnail(upload.ThumbnailUrl!)).EnsureStatus(HttpStatusCode.BadRequest);
    }
}
