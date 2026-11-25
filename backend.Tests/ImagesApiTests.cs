using System.Net;

namespace DinnerPlanner.Api.Tests;

public class ImagesApiTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Images_are_cached_by_browsers_for_a_year()
    {
        var response = await client.GetAsync("/images/placeholders/recipe-photo-placeholder.png");

        await response.EnsureStatus(HttpStatusCode.OK);
        Assert.Equal("public, max-age=31536000, immutable", response.Headers.CacheControl!.ToString());
    }
}
