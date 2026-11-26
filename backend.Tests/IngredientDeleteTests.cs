using System.Net;
using System.Text.Json;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT B1: deleting a used ingredient is refused, and replace-with moves its uses to another one.</summary>
public class IngredientDeleteTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private static object PlannedIngredient(int ingredientId, decimal amount, string unit = "Gram") => new
    {
        recipeId = (int?)null,
        ingredientId,
        role = "Side",
        sortOrder = 0,
        portions = (decimal?)null,
        amount,
        unit,
    };

    [Fact]
    public async Task Deleting_an_ingredient_a_recipe_uses_is_a_conflict_that_lists_the_recipe()
    {
        var chicken = await CreateIngredient(client, "ID chicken", "Chicken");
        var recipe = await CreateRecipe(client, Recipe("ID wraps", 2, [Line(chicken.IngredientId, 300)]));

        var response = await client.DeleteAsync($"/api/ingredients/{chicken.IngredientId}");

        await response.EnsureStatus(HttpStatusCode.Conflict);
        var body = await response.ReadJson();
        Assert.Contains("ID wraps", body.GetProperty("error").GetString());
        var listed = Assert.Single(body.GetProperty("recipes").EnumerateArray());
        Assert.Equal(recipe.RecipeId, listed.GetProperty("recipeId").GetInt32());
        Assert.Empty(body.GetProperty("mealPlanEntries").EnumerateArray());

        // Nothing was removed.
        var reloaded = await client.GetJson<RecipeDto>($"/api/recipes/{recipe.RecipeId}");
        Assert.Equal(chicken.IngredientId, Assert.Single(reloaded.Ingredients).Ingredient.IngredientId);
        await (await client.GetAsync($"/api/ingredients/{chicken.IngredientId}")).EnsureStatus(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Deleting_an_ingredient_planned_directly_is_a_conflict_not_a_server_error()
    {
        var banana = await CreateIngredient(client, "ID banana", "Fruit");
        var date = new DateOnly(2031, 3, 4);
        var plan = await client.PostJson("/api/mealplans", MealEntry(date, "Breakfast", PlannedIngredient(banana.IngredientId, 120)));
        await plan.EnsureStatus(HttpStatusCode.Created);

        var response = await client.DeleteAsync($"/api/ingredients/{banana.IngredientId}");

        await response.EnsureStatus(HttpStatusCode.Conflict);
        var body = await response.ReadJson();
        var meal = Assert.Single(body.GetProperty("mealPlanEntries").EnumerateArray());
        Assert.Equal("2031-03-04", meal.GetProperty("date").GetString());
        Assert.Equal("Breakfast", meal.GetProperty("slot").GetString());
    }

    [Fact]
    public async Task An_unused_ingredient_is_deleted()
    {
        var lonely = await CreateIngredient(client, "ID lonely");

        await (await client.DeleteAsync($"/api/ingredients/{lonely.IngredientId}")).EnsureStatus(HttpStatusCode.NoContent);
        await (await client.GetAsync($"/api/ingredients/{lonely.IngredientId}")).EnsureStatus(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Replace_with_moves_recipe_lines_and_planned_items_merges_shared_lines_and_deletes_the_old_one()
    {
        var duplicate = await CreateIngredient(client, "ID kyllingfilet", "Chicken");
        var keeper = await CreateIngredient(client, "ID chicken breast", "Chicken");
        var onlyDuplicate = await CreateRecipe(client, Recipe("ID bowl", 2, [Line(duplicate.IngredientId, 250)]));
        var both = await CreateRecipe(client, Recipe(
            "ID stew",
            4,
            [Line(duplicate.IngredientId, 200), Line(keeper.IngredientId, 0.1m, "Kilogram")]));
        var date = new DateOnly(2031, 3, 5);
        var plan = await client.PostJson("/api/mealplans", MealEntry(date, "Dinner", PlannedIngredient(duplicate.IngredientId, 150)));
        await plan.EnsureStatus(HttpStatusCode.Created);
        var entry = await plan.Read<MealPlanEntryDto>();

        var response = await client.PostAsync($"/api/ingredients/{duplicate.IngredientId}/replace-with/{keeper.IngredientId}", null);

        await response.EnsureStatus(HttpStatusCode.OK);
        var body = await response.ReadJson();
        Assert.Equal(duplicate.IngredientId, body.GetProperty("deletedIngredientId").GetInt32());
        Assert.Equal(keeper.IngredientId, body.GetProperty("replacement").GetProperty("ingredientId").GetInt32());
        Assert.Equal(1, body.GetProperty("recipeLinesMoved").GetInt32());
        Assert.Equal(1, body.GetProperty("recipeLinesMerged").GetInt32());
        Assert.Equal(1, body.GetProperty("mealPlanItemsMoved").GetInt32());

        await (await client.GetAsync($"/api/ingredients/{duplicate.IngredientId}")).EnsureStatus(HttpStatusCode.NotFound);

        var bowl = await client.GetJson<RecipeDto>($"/api/recipes/{onlyDuplicate.RecipeId}");
        var bowlLine = Assert.Single(bowl.Ingredients);
        Assert.Equal(keeper.IngredientId, bowlLine.Ingredient.IngredientId);
        Assert.Equal(250m, bowlLine.Amount);

        var stew = await client.GetJson<RecipeDto>($"/api/recipes/{both.RecipeId}");
        var stewLine = Assert.Single(stew.Ingredients);
        Assert.Equal(keeper.IngredientId, stewLine.Ingredient.IngredientId);
        Assert.Equal(300m, stewLine.Amount);
        Assert.Equal("Gram", stewLine.Unit.ToString());

        var planned = await client.GetJson<MealPlanEntryDto>($"/api/mealplans/{entry.MealPlanEntryId}");
        Assert.Equal(keeper.IngredientId, Assert.Single(planned.Recipes).IngredientId);
    }

    [Fact]
    public async Task Replace_with_refuses_to_add_weight_to_volume_and_changes_nothing()
    {
        var milk = await CreateIngredient(client, "ID milk", "Dairy");
        var otherMilk = await CreateIngredient(client, "ID whole milk", "Dairy");
        var recipe = await CreateRecipe(client, Recipe(
            "ID porridge",
            2,
            [Line(milk.IngredientId, 300, "Milliliter"), Line(otherMilk.IngredientId, 100)]));

        var response = await client.PostAsync($"/api/ingredients/{milk.IngredientId}/replace-with/{otherMilk.IngredientId}", null);

        await response.EnsureStatus(HttpStatusCode.Conflict);
        Assert.Contains("ID porridge", (await response.ReadJson()).GetProperty("error").GetString());
        await (await client.GetAsync($"/api/ingredients/{milk.IngredientId}")).EnsureStatus(HttpStatusCode.OK);
        Assert.Equal(2, (await client.GetJson<RecipeDto>($"/api/recipes/{recipe.RecipeId}")).Ingredients.Count);
    }

    [Fact]
    public async Task Replace_with_itself_or_a_missing_ingredient_is_rejected()
    {
        var salt = await CreateIngredient(client, "ID salt", "Spice");

        await (await client.PostAsync($"/api/ingredients/{salt.IngredientId}/replace-with/{salt.IngredientId}", null))
            .EnsureStatus(HttpStatusCode.BadRequest);
        await (await client.PostAsync($"/api/ingredients/{salt.IngredientId}/replace-with/999999", null))
            .EnsureStatus(HttpStatusCode.NotFound);
        await (await client.PostAsync($"/api/ingredients/999999/replace-with/{salt.IngredientId}", null))
            .EnsureStatus(HttpStatusCode.NotFound);
    }
}
