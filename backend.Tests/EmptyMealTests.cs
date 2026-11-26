using System.Net;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT B5: a meal with no items is never stored.</summary>
public class EmptyMealTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private Task<List<MealPlanEntryDto>> Day(DateOnly date) =>
        client.GetJson<List<MealPlanEntryDto>>($"/api/mealplans?from={date:yyyy-MM-dd}&to={date:yyyy-MM-dd}");

    [Fact]
    public async Task Creating_a_meal_with_no_items_is_rejected_and_leaves_the_slot_free()
    {
        var date = new DateOnly(2032, 5, 3);

        var response = await client.PostJson("/api/mealplans", MealEntry(date, "Dinner"));

        await response.EnsureStatus(HttpStatusCode.BadRequest);
        Assert.Contains("at least one", (await response.ReadJson()).GetProperty("error").GetString());
        Assert.Empty(await Day(date));

        var rice = await CreateIngredient(client, "EM rice", "Grain");
        var recipe = await CreateRecipe(client, Recipe("EM bowl", 2, [Line(rice.IngredientId, 100)]));
        await (await client.PostJson("/api/mealplans", MealEntry(date, "Dinner", PlannedRecipe(recipe.RecipeId, 2))))
            .EnsureStatus(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Updating_a_meal_to_no_items_deletes_it()
    {
        var date = new DateOnly(2032, 5, 4);
        var rice = await CreateIngredient(client, "EM rice 2", "Grain");
        var recipe = await CreateRecipe(client, Recipe("EM bowl 2", 2, [Line(rice.IngredientId, 100)]));
        var created = await (await client.PostJson("/api/mealplans", MealEntry(date, "Lunch", PlannedRecipe(recipe.RecipeId, 2))))
            .Read<MealPlanEntryDto>();

        var response = await client.PutJson($"/api/mealplans/{created.MealPlanEntryId}", MealEntry(date, "Lunch"));

        await response.EnsureStatus(HttpStatusCode.NoContent);
        Assert.Empty(await Day(date));
        await (await client.GetAsync($"/api/mealplans/{created.MealPlanEntryId}")).EnsureStatus(HttpStatusCode.NotFound);
    }
}
