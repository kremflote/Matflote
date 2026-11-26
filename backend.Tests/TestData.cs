using System.Net;
using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Tests;

/// <summary>Small helpers that create rows through the regular HTTP API.</summary>
public static class TestData
{
    public static async Task<IngredientDto> CreateIngredient(HttpClient client, string name, params string[] tags)
    {
        var response = await client.PostJson("/api/ingredients", new
        {
            ingredientName = name,
            tags,
        });
        await response.EnsureStatus(HttpStatusCode.Created);
        return await response.Read<IngredientDto>();
    }

    public static object Line(int ingredientId, decimal? amount, string unit = "Gram") => new
    {
        ingredientId,
        amount,
        unit,
        preparation = "None",
    };

    public static object Component(int recipeId, decimal amount, string unit = "Gram", int sortOrder = 1) => new
    {
        recipeId,
        amount,
        unit,
        preparation = "None",
        sortOrder,
    };

    public static object Recipe(
        string name,
        decimal portions,
        object[] ingredients,
        object[]? components = null,
        string[]? tags = null) => new
    {
        name,
        description = (string?)null,
        instructions = (string?)null,
        imageUrl = (string?)null,
        portions,
        ingredients,
        tags = tags ?? [],
        components = components ?? [],
    };

    public static async Task<RecipeDto> CreateRecipe(HttpClient client, object request)
    {
        var response = await client.PostJson("/api/recipes", request);
        await response.EnsureStatus(HttpStatusCode.Created);
        return await response.Read<RecipeDto>();
    }

    public static object MealEntry(DateOnly date, string slot, params object[] recipes) => new
    {
        date,
        slot,
        notes = (string?)null,
        recipes,
    };

    public static object PlannedRecipe(int recipeId, decimal portions, string role = "Main", int sortOrder = 0) => new
    {
        recipeId,
        ingredientId = (int?)null,
        role,
        sortOrder,
        portions,
        amount = (decimal?)null,
        unit = (string?)null,
    };
}
