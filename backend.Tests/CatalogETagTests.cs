using System.Net;
using System.Net.Http.Headers;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class CatalogETagTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private static readonly string[] CatalogUrls =
    [
        "/api/recipes",
        "/api/ingredients",
        "/api/ingredient-tag-categories",
        "/api/brands",
    ];

    private readonly HttpClient client = factory.CreateClient();

    private async Task<string> ETag(string url)
    {
        var response = await client.GetAsync(url);
        await response.EnsureStatus(HttpStatusCode.OK);
        Assert.NotNull(response.Headers.ETag);
        return response.Headers.ETag!.ToString();
    }

    private async Task<Dictionary<string, string>> AllETags()
    {
        var tags = new Dictionary<string, string>();
        foreach (var url in CatalogUrls)
        {
            tags[url] = await ETag(url);
        }

        return tags;
    }

    private async Task AssertChanged(Func<Task> write, params string[] changedUrls)
    {
        var before = await AllETags();
        await write();
        var after = await AllETags();

        foreach (var url in CatalogUrls)
        {
            if (changedUrls.Contains(url))
            {
                Assert.True(before[url] != after[url], $"{url} should have a new ETag.");
            }
            else
            {
                Assert.True(before[url] == after[url], $"{url} should keep its ETag.");
            }
        }
    }

    [Theory]
    [InlineData("/api/recipes")]
    [InlineData("/api/ingredients")]
    [InlineData("/api/ingredient-tag-categories")]
    [InlineData("/api/brands")]
    public async Task A_catalog_list_is_answered_304_when_nothing_changed(string url)
    {
        var first = await client.GetAsync(url);
        await first.EnsureStatus(HttpStatusCode.OK);
        Assert.True(first.Headers.ETag!.IsWeak);
        Assert.True(first.Headers.CacheControl!.NoCache);

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.IfNoneMatch.Add(first.Headers.ETag);
        var second = await client.SendAsync(request);

        await second.EnsureStatus(HttpStatusCode.NotModified);
        Assert.Equal(first.Headers.ETag, second.Headers.ETag);
        Assert.Empty(await second.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task A_stale_or_foreign_validator_gets_the_full_list()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/brands");
        request.Headers.IfNoneMatch.Add(new EntityTagHeaderValue("\"some-other-process-brands-0\"", isWeak: true));

        var response = await client.SendAsync(request);

        await response.EnsureStatus(HttpStatusCode.OK);
        Assert.StartsWith("[", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task A_recipe_write_changes_only_the_recipe_list()
    {
        var rice = await CreateIngredient(client, "ETag rice", "Grain");

        await AssertChanged(
            () => CreateRecipe(client, Recipe("ETag bowl", 2, [Line(rice.IngredientId, 100)])),
            "/api/recipes");
    }

    [Fact]
    public async Task An_ingredient_write_also_changes_the_recipe_list()
    {
        await AssertChanged(
            () => CreateIngredient(client, "ETag onion", "Vegetable"),
            "/api/ingredients",
            "/api/recipes");
    }

    [Fact]
    public async Task A_brand_write_changes_brands_ingredients_and_recipes()
    {
        await AssertChanged(
            async () => (await client.PostJson("/api/brands", new { name = "ETag brand" })).EnsureSuccessStatusCode(),
            "/api/brands",
            "/api/ingredients",
            "/api/recipes");
    }

    [Fact]
    public async Task A_tag_write_changes_tags_ingredients_and_recipes()
    {
        await AssertChanged(
            async () => (await client.PostJson("/api/ingredient-tag-categories", new { name = "ETag category" })).EnsureSuccessStatusCode(),
            "/api/ingredient-tag-categories",
            "/api/ingredients",
            "/api/recipes");
    }

    [Fact]
    public async Task A_meal_plan_write_changes_no_catalog_list()
    {
        var rice = await CreateIngredient(client, "ETag plan rice", "Grain");
        var recipe = await CreateRecipe(client, Recipe("ETag planned", 2, [Line(rice.IngredientId, 100)]));

        await AssertChanged(
            async () => await (await client.PostJson(
                "/api/mealplans",
                MealEntry(new DateOnly(2031, 1, 6), "Dinner", PlannedRecipe(recipe.RecipeId, 2))))
                .EnsureStatus(HttpStatusCode.Created));
    }

    [Fact]
    public async Task A_rejected_write_changes_nothing()
    {
        await AssertChanged(
            async () => await (await client.PostJson("/api/recipes", Recipe("ETag bad", 2, [Line(999_999, 100)])))
                .EnsureStatus(HttpStatusCode.BadRequest));
    }
}
