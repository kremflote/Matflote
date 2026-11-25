using System.Net;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class MealPlansApiTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private async Task<(RecipeDto First, RecipeDto Second)> TwoRecipes(string prefix)
    {
        var rice = await CreateIngredient(client, $"{prefix} rice", "Grain");
        var first = await CreateRecipe(client, Recipe($"{prefix} one", 2, [Line(rice.IngredientId, 200)]));
        var second = await CreateRecipe(client, Recipe($"{prefix} two", 4, [Line(rice.IngredientId, 400)]));
        return (first, second);
    }

    private Task<List<MealPlanEntryDto>> Week(DateOnly from) =>
        client.GetJson<List<MealPlanEntryDto>>($"/api/mealplans?from={from:yyyy-MM-dd}&to={from.AddDays(6):yyyy-MM-dd}");

    [Fact]
    public async Task Create_replace_and_delete_a_meal()
    {
        var (first, second) = await TwoRecipes("MP a");
        var monday = new DateOnly(2030, 1, 7);

        var create = await client.PostJson("/api/mealplans", MealEntry(monday, "Dinner", PlannedRecipe(first.RecipeId, 2)));
        await create.EnsureStatus(HttpStatusCode.Created);
        var created = await create.Read<MealPlanEntryDto>();
        Assert.Equal(monday, created.Date);
        Assert.Equal(first.RecipeId, Assert.Single(created.Recipes).RecipeId);

        var replace = await client.PutJson(
            $"/api/mealplans/{created.MealPlanEntryId}",
            MealEntry(monday, "Dinner", PlannedRecipe(second.RecipeId, 3), PlannedRecipe(first.RecipeId, 1, "Side", 1)));
        await replace.EnsureStatus(HttpStatusCode.NoContent);

        var week = await Week(monday);
        var entry = Assert.Single(week);
        Assert.Equal(created.MealPlanEntryId, entry.MealPlanEntryId);
        Assert.Collection(
            entry.Recipes,
            item =>
            {
                Assert.Equal(second.RecipeId, item.RecipeId);
                Assert.Equal(3m, item.Portions);
            },
            item =>
            {
                Assert.Equal(first.RecipeId, item.RecipeId);
                Assert.Equal("Side", item.Role.ToString());
            });

        var delete = await client.DeleteAsync($"/api/mealplans/{created.MealPlanEntryId}");
        await delete.EnsureStatus(HttpStatusCode.NoContent);
        Assert.Empty(await Week(monday));
    }

    [Fact]
    public async Task A_second_meal_in_the_same_slot_is_a_conflict()
    {
        var (first, second) = await TwoRecipes("MP b");
        var date = new DateOnly(2030, 2, 4);

        var create = await client.PostJson("/api/mealplans", MealEntry(date, "Lunch", PlannedRecipe(first.RecipeId, 2)));
        await create.EnsureStatus(HttpStatusCode.Created);

        var again = await client.PostJson("/api/mealplans", MealEntry(date, "Lunch", PlannedRecipe(second.RecipeId, 2)));
        await again.EnsureStatus(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Invalid_items_are_rejected()
    {
        var date = new DateOnly(2030, 3, 4);

        var unknownRecipe = await client.PostJson("/api/mealplans", MealEntry(date, "Dinner", PlannedRecipe(999_999, 2)));
        await unknownRecipe.EnsureStatus(HttpStatusCode.BadRequest);

        var (first, _) = await TwoRecipes("MP c");
        var zeroPortions = await client.PostJson("/api/mealplans", MealEntry(date, "Dinner", PlannedRecipe(first.RecipeId, 0)));
        await zeroPortions.EnsureStatus(HttpStatusCode.BadRequest);

        Assert.Empty(await Week(date));
    }

    [Fact]
    public async Task Deleting_a_planned_recipe_removes_the_meal_that_only_held_it()
    {
        var (first, second) = await TwoRecipes("MP d");
        var date = new DateOnly(2030, 4, 1);

        await (await client.PostJson("/api/mealplans", MealEntry(date, "Dinner", PlannedRecipe(first.RecipeId, 2))))
            .EnsureStatus(HttpStatusCode.Created);
        await (await client.PostJson("/api/mealplans", MealEntry(date, "Lunch", PlannedRecipe(first.RecipeId, 2), PlannedRecipe(second.RecipeId, 1, "Side", 1))))
            .EnsureStatus(HttpStatusCode.Created);

        await (await client.DeleteAsync($"/api/recipes/{first.RecipeId}")).EnsureStatus(HttpStatusCode.NoContent);

        var entry = Assert.Single(await Week(date));
        Assert.Equal("Lunch", entry.Slot.ToString());
        Assert.Equal(second.RecipeId, Assert.Single(entry.Recipes).RecipeId);
    }
}
