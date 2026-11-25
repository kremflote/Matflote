using System.Net;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class RecipesApiTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Create_update_and_delete_a_recipe_with_a_component()
    {
        var pasta = await CreateIngredient(client, "RT pasta", "Grain");
        var tomato = await CreateIngredient(client, "RT tomato", "Vegetable");
        var basil = await CreateIngredient(client, "RT basil", "Herb");

        var sauce = await CreateRecipe(client, Recipe("RT tomato sauce", 2, [Line(tomato.IngredientId, 400)]));
        var created = await CreateRecipe(client, Recipe(
            "RT pasta dinner",
            4,
            [Line(pasta.IngredientId, 500)],
            [Component(sauce.RecipeId, 200)],
            ["Dinner"]));

        Assert.Equal("RT pasta dinner", created.Name);
        Assert.Equal(4m, created.Portions);
        Assert.Equal(["Dinner"], created.Tags);
        var line = Assert.Single(created.Ingredients);
        Assert.Equal(pasta.IngredientId, line.Ingredient.IngredientId);
        Assert.Equal(500m, line.Amount);
        var component = Assert.Single(created.Components);
        Assert.Equal(sauce.RecipeId, component.RecipeId);
        Assert.Equal(200m, component.Amount);

        var update = await client.PutJson($"/api/recipes/{created.RecipeId}", Recipe(
            "RT pasta supper",
            3,
            [Line(pasta.IngredientId, 300), Line(basil.IngredientId, 10)],
            [],
            ["Dinner", "Lunch"]));
        await update.EnsureStatus(HttpStatusCode.NoContent);

        var updated = await client.GetJson<RecipeDto>($"/api/recipes/{created.RecipeId}");
        Assert.Equal("RT pasta supper", updated.Name);
        Assert.Equal(3m, updated.Portions);
        Assert.Equal(["Dinner", "Lunch"], updated.Tags);
        Assert.Equal(
            [(basil.IngredientId, 10m), (pasta.IngredientId, 300m)],
            updated.Ingredients
                .Select(item => (item.Ingredient.IngredientId, item.Amount ?? 0m))
                .OrderBy(item => item.IngredientId == basil.IngredientId ? 0 : 1));
        Assert.Empty(updated.Components);

        var delete = await client.DeleteAsync($"/api/recipes/{created.RecipeId}");
        await delete.EnsureStatus(HttpStatusCode.NoContent);
        var gone = await client.GetAsync($"/api/recipes/{created.RecipeId}");
        await gone.EnsureStatus(HttpStatusCode.NotFound);

        // The component recipe is independent and survives.
        await client.GetJson<RecipeDto>($"/api/recipes/{sauce.RecipeId}");
    }

    [Fact]
    public async Task Deleting_a_component_recipe_removes_the_link_from_its_parent()
    {
        var flour = await CreateIngredient(client, "RT flour", "Grain");
        var child = await CreateRecipe(client, Recipe("RT dough", 1, [Line(flour.IngredientId, 250)]));
        var parent = await CreateRecipe(client, Recipe("RT pizza", 2, [Line(flour.IngredientId, 10)], [Component(child.RecipeId, 250)]));

        var delete = await client.DeleteAsync($"/api/recipes/{child.RecipeId}");
        await delete.EnsureStatus(HttpStatusCode.NoContent);

        var reloaded = await client.GetJson<RecipeDto>($"/api/recipes/{parent.RecipeId}");
        Assert.Empty(reloaded.Components);
    }

    [Fact]
    public async Task An_update_that_would_create_a_component_cycle_is_rejected()
    {
        var salt = await CreateIngredient(client, "RT salt", "Spice");
        var inner = await CreateRecipe(client, Recipe("RT cycle inner", 1, [Line(salt.IngredientId, 5)]));
        var outer = await CreateRecipe(client, Recipe("RT cycle outer", 1, [Line(salt.IngredientId, 5)], [Component(inner.RecipeId, 5)]));

        var response = await client.PutJson($"/api/recipes/{inner.RecipeId}", Recipe(
            "RT cycle inner",
            1,
            [Line(salt.IngredientId, 5)],
            [Component(outer.RecipeId, 5)]));

        await response.EnsureStatus(HttpStatusCode.BadRequest);
        Assert.Contains("circular", await response.Content.ReadAsStringAsync());
        var unchanged = await client.GetJson<RecipeDto>($"/api/recipes/{inner.RecipeId}");
        Assert.Empty(unchanged.Components);
    }

    [Fact]
    public async Task A_recipe_cannot_use_itself_as_a_component()
    {
        var salt = await CreateIngredient(client, "RT salt 2", "Spice");
        var recipe = await CreateRecipe(client, Recipe("RT self", 1, [Line(salt.IngredientId, 5)]));

        var response = await client.PutJson($"/api/recipes/{recipe.RecipeId}", Recipe(
            "RT self",
            1,
            [Line(salt.IngredientId, 5)],
            [Component(recipe.RecipeId, 5)]));

        await response.EnsureStatus(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Unknown_ingredient_and_component_ids_are_rejected()
    {
        var unknownIngredient = await client.PostJson("/api/recipes", Recipe("RT bad line", 1, [Line(999_999, 5)]));
        await unknownIngredient.EnsureStatus(HttpStatusCode.BadRequest);

        var salt = await CreateIngredient(client, "RT salt 3", "Spice");
        var unknownComponent = await client.PostJson("/api/recipes", Recipe(
            "RT bad component",
            1,
            [Line(salt.IngredientId, 5)],
            [Component(999_999, 5)]));
        await unknownComponent.EnsureStatus(HttpStatusCode.BadRequest);
    }
}
