using System.Net;
using System.Text.Json;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>
/// AUDIT C2: every error is ProblemDetails, with the message also in <c>error</c> (and the list in <c>details</c>) as
/// before; the assistant API's documented result bodies stay as they are.
/// </summary>
public class ProblemDetailsTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private static async Task<JsonElement> ReadProblem(HttpResponseMessage response, HttpStatusCode status)
    {
        await response.EnsureStatus(status);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.ReadJson();
        Assert.Equal((int)status, body.GetProperty("status").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("title").GetString()));
        return body;
    }

    [Fact]
    public async Task A_message_error_is_problem_details_with_the_message_in_detail_and_error()
    {
        var recipe = await CreateRecipe(client, Recipe("PD rated", 2, []));

        var body = await ReadProblem(await client.PutJson($"/api/recipes/{recipe.RecipeId}/rating", new { rating = 9 }), HttpStatusCode.BadRequest);

        Assert.StartsWith("Rating must be between", body.GetProperty("detail").GetString());
        Assert.Equal(body.GetProperty("detail").GetString(), body.GetProperty("error").GetString());
    }

    [Fact]
    public async Task Several_problems_are_listed_in_details()
    {
        var body = await ReadProblem(
            await client.PostJson("/api/recipes", Recipe("PD tags", 2, [], tags: ["PD no such tag", "PD nor this"])),
            HttpStatusCode.BadRequest);

        Assert.Equal(2, body.GetProperty("details").GetArrayLength());
        Assert.StartsWith("2 problems:", body.GetProperty("error").GetString());
    }

    [Fact]
    public async Task A_missing_item_and_a_missing_image_are_problem_details_too()
    {
        var recipe = await ReadProblem(await client.GetAsync("/api/recipes/987654"), HttpStatusCode.NotFound);
        Assert.Equal("Not Found", recipe.GetProperty("error").GetString());

        await ReadProblem(await client.GetAsync("/images/recipes/missing.jpg"), HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task A_conflict_keeps_its_extra_fields()
    {
        var rice = await CreateIngredient(client, "PD rice");
        await CreateRecipe(client, Recipe("PD rice bowl", 2, [Line(rice.IngredientId, 100)]));

        var body = await ReadProblem(await client.DeleteAsync($"/api/ingredients/{rice.IngredientId}"), HttpStatusCode.Conflict);

        Assert.Single(body.GetProperty("recipes").EnumerateArray());
        Assert.Empty(body.GetProperty("mealPlanEntries").EnumerateArray());
        Assert.Contains("PD rice bowl", body.GetProperty("error").GetString());
    }

    [Fact]
    public async Task A_model_validation_error_carries_error_as_well()
    {
        var body = await ReadProblem(await client.PostJson("/api/recipes", new { name = "PD bad", portions = "many" }), HttpStatusCode.BadRequest);

        Assert.True(body.TryGetProperty("errors", out _));
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("error").GetString()));
    }

    [Fact]
    public async Task The_assistant_result_bodies_stay_results()
    {
        var response = await client.PostJson("/api/assistant/recipes", new
        {
            recipes = new[] { new { name = "PD assistant", portions = 2, tags = new[] { "PD unknown tag" }, ingredients = Array.Empty<object>() } },
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.ReadJson();
        Assert.False(body.GetProperty("applied").GetBoolean());
        Assert.False(body.TryGetProperty("title", out _));
    }
}
