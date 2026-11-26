using System.Net;
using System.Text.Json;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT B2: recipe and ingredient writes reject what they used to drop, and say what was wrong.</summary>
public class CatalogWriteValidationTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private static async Task<string> ErrorOf(HttpResponseMessage response)
    {
        await response.EnsureStatus(HttpStatusCode.BadRequest);
        Assert.Contains("json", response.Content.Headers.ContentType?.MediaType);
        return (await response.ReadJson()).GetProperty("error").GetString()!;
    }

    private async Task<bool> RecipeExists(string name) =>
        (await client.GetJson<List<RecipeDto>>("/api/recipes")).Any(recipe => recipe.Name == name);

    [Fact]
    public async Task A_recipe_with_an_unknown_tag_is_rejected_and_names_the_tag()
    {
        var rice = await CreateIngredient(client, "CV rice", "Grain");

        var error = await ErrorOf(await client.PostJson("/api/recipes", Recipe("CV tagged", 2, [Line(rice.IngredientId, 100)], tags: ["Dinner", "NoSuchTag"])));

        Assert.Contains("NoSuchTag", error);
        Assert.False(await RecipeExists("CV tagged"));
    }

    [Fact]
    public async Task Tags_match_regardless_of_case_and_spacing()
    {
        var rice = await CreateIngredient(client, "CV rice 2", "Grain");

        var recipe = await CreateRecipe(client, Recipe("CV spaced tag", 2, [Line(rice.IngredientId, 100)], tags: ["dinner"]));

        Assert.Equal(["Dinner"], recipe.Tags);
    }

    [Fact]
    public async Task A_recipe_that_lists_an_ingredient_twice_is_rejected()
    {
        var rice = await CreateIngredient(client, "CV rice 3", "Grain");

        var error = await ErrorOf(await client.PostJson("/api/recipes", Recipe(
            "CV twice",
            2,
            [Line(rice.IngredientId, 100), Line(rice.IngredientId, 50)])));

        Assert.Contains("CV rice 3", error);
        Assert.Contains("more than once", error.Replace("2 times", "more than once"));
        Assert.False(await RecipeExists("CV twice"));
    }

    [Fact]
    public async Task A_recipe_line_with_an_unknown_preparation_or_unit_is_rejected()
    {
        var onion = await CreateIngredient(client, "CV onion", "Vegetable");

        var badPreparation = await ErrorOf(await client.PostJson("/api/recipes", Recipe(
            "CV bad prep",
            2,
            [new { ingredientId = onion.IngredientId, amount = 100, unit = "Gram", preparation = 99 }])));
        Assert.Contains("preparation", badPreparation);
        Assert.Contains("CV onion", badPreparation);

        var badUnit = await ErrorOf(await client.PostJson("/api/recipes", Recipe(
            "CV bad unit",
            2,
            [new { ingredientId = onion.IngredientId, amount = 100, unit = 42, preparation = "None" }])));
        Assert.Contains("unit", badUnit);

        Assert.False(await RecipeExists("CV bad prep"));
        Assert.False(await RecipeExists("CV bad unit"));
    }

    [Fact]
    public async Task A_component_listed_twice_is_rejected()
    {
        var rice = await CreateIngredient(client, "CV rice 4", "Grain");
        var child = await CreateRecipe(client, Recipe("CV child", 1, [Line(rice.IngredientId, 100)]));

        var error = await ErrorOf(await client.PostJson("/api/recipes", Recipe(
            "CV parent",
            2,
            [Line(rice.IngredientId, 10)],
            [Component(child.RecipeId, 50), Component(child.RecipeId, 20, sortOrder: 2)])));

        Assert.Contains("CV child", error);
    }

    [Fact]
    public async Task All_problems_are_reported_together()
    {
        var rice = await CreateIngredient(client, "CV rice 5", "Grain");

        var response = await client.PostJson("/api/recipes", Recipe(
            "CV many",
            2,
            [Line(rice.IngredientId, 100), Line(rice.IngredientId, 50)],
            tags: ["Nope"]));

        await response.EnsureStatus(HttpStatusCode.BadRequest);
        var details = (await response.ReadJson()).GetProperty("details").EnumerateArray().Select(item => item.GetString()).ToList();
        Assert.Equal(2, details.Count);
    }

    [Fact]
    public async Task An_update_with_an_unknown_tag_is_rejected_and_keeps_the_stored_recipe()
    {
        var rice = await CreateIngredient(client, "CV rice 6", "Grain");
        var recipe = await CreateRecipe(client, Recipe("CV keep", 2, [Line(rice.IngredientId, 100)], tags: ["Dinner"]));

        var error = await ErrorOf(await client.PutJson($"/api/recipes/{recipe.RecipeId}", Recipe(
            "CV keep",
            2,
            [Line(rice.IngredientId, 100)],
            tags: ["Dinner", "Missing"])));

        Assert.Contains("Missing", error);
        Assert.Equal(["Dinner"], (await client.GetJson<RecipeDto>($"/api/recipes/{recipe.RecipeId}")).Tags);
    }

    [Fact]
    public async Task An_ingredient_with_an_unknown_tag_is_rejected_on_create_and_update()
    {
        var create = await client.PostJson("/api/ingredients", new { ingredientName = "CV leek", tags = new[] { "Vegetable", "Vegtable" } });
        var createError = await ErrorOf(create);
        Assert.Contains("Vegtable", createError);
        Assert.Contains("Did you mean", createError);

        var leek = await CreateIngredient(client, "CV leek", "Vegetable");
        var updateError = await ErrorOf(await client.PutJson($"/api/ingredients/{leek.IngredientId}", new
        {
            ingredientName = "CV leek",
            tags = new[] { "NoSuchTag" },
        }));
        Assert.Contains("NoSuchTag", updateError);
        Assert.Equal(["Vegetable"], (await client.GetJson<IngredientDto>($"/api/ingredients/{leek.IngredientId}")).Tags);
    }
}
