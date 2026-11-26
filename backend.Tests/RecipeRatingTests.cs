using System.Net;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class RecipeRatingTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private async Task<RecipeDto> NewRecipe(string name) =>
        await CreateRecipe(client, Recipe(name, 2, [], tags: ["Dinner"]));

    [Fact]
    public async Task A_rating_is_saved_shown_everywhere_and_cleared()
    {
        var recipe = await NewRecipe("RR rated");
        Assert.Null(recipe.Rating);

        var response = await client.PutJson($"/api/recipes/{recipe.RecipeId}/rating", new { rating = 4, note = "  Kids loved it  " });
        await response.EnsureStatus(HttpStatusCode.OK);
        var rated = await response.Read<RecipeDto>();
        Assert.Equal(4, rated.Rating);
        Assert.Equal("Kids loved it", rated.RatingNote);

        Assert.Equal(4, (await client.GetJson<RecipeDto>($"/api/recipes/{recipe.RecipeId}")).Rating);
        Assert.Equal(4, (await client.GetJson<List<RecipeDto>>("/api/recipes")).Single(item => item.RecipeId == recipe.RecipeId).Rating);
        var summary = (await client.Context()).FindRecipe("RR rated")!.Value;
        Assert.Equal(4, summary.GetProperty("rating").GetInt32());
        Assert.Equal("Kids loved it", summary.GetProperty("ratingNote").GetString());

        // Clearing the rating clears the note with it, and the context leaves both out.
        var cleared = await (await client.PutJson($"/api/recipes/{recipe.RecipeId}/rating", new { rating = (int?)null, note = "ignored" })).Read<RecipeDto>();
        Assert.Null(cleared.Rating);
        Assert.Null(cleared.RatingNote);
        Assert.False((await client.Context()).FindRecipe("RR rated")!.Value.TryGetProperty("rating", out _));
    }

    [Fact]
    public async Task Editing_the_recipe_or_updating_it_through_the_assistant_keeps_the_rating()
    {
        var recipe = await NewRecipe("RR kept");
        await (await client.PutJson($"/api/recipes/{recipe.RecipeId}/rating", new { rating = 2, note = "Too salty" })).EnsureStatus(HttpStatusCode.OK);

        await (await client.PutJson($"/api/recipes/{recipe.RecipeId}", Recipe("RR kept", 3, [], tags: ["Dinner"]))).EnsureStatus(HttpStatusCode.OK);
        await client.Import(new
        {
            onExistingRecipe = "update",
            recipes = new[] { new { name = "RR kept", portions = 4, tags = new[] { "Dinner" }, ingredients = Array.Empty<object>() } },
        });

        var after = await client.GetJson<RecipeDto>($"/api/recipes/{recipe.RecipeId}");
        Assert.Equal(4m, after.Portions);
        Assert.Equal(2, after.Rating);
        Assert.Equal("Too salty", after.RatingNote);
    }

    [Fact]
    public async Task Rating_a_recipe_gives_the_recipe_list_a_new_etag()
    {
        var recipe = await NewRecipe("RR etag");
        var before = (await client.GetAsync("/api/recipes")).Headers.ETag!.ToString();

        await (await client.PutJson($"/api/recipes/{recipe.RecipeId}/rating", new { rating = 5 })).EnsureStatus(HttpStatusCode.OK);

        Assert.NotEqual(before, (await client.GetAsync("/api/recipes")).Headers.ETag!.ToString());
    }

    [Theory]
    [InlineData(0, null, "between 1 and 5")]
    [InlineData(6, null, "between 1 and 5")]
    [InlineData(3, 501, "at most 500 characters")]
    public async Task Invalid_ratings_are_400_and_change_nothing(int rating, int? noteLength, string expected)
    {
        var recipe = await NewRecipe($"RR invalid {rating}{noteLength}");

        var response = await client.PutJson($"/api/recipes/{recipe.RecipeId}/rating", new { rating, note = noteLength is null ? null : new string('n', noteLength.Value) });

        await response.EnsureStatus(HttpStatusCode.BadRequest);
        Assert.Contains(expected, await response.Content.ReadAsStringAsync());
        Assert.Null((await client.GetJson<RecipeDto>($"/api/recipes/{recipe.RecipeId}")).Rating);
    }

    [Fact]
    public async Task Rating_an_unknown_recipe_is_404()
    {
        var response = await client.PutJson("/api/recipes/987654/rating", new { rating = 3 });
        await response.EnsureStatus(HttpStatusCode.NotFound);
    }
}
