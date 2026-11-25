using System.Net;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT B6 and F15: units are combined, totals rounded to shop sizes, sections found without English tag names.</summary>
public class ShoppingListArithmeticTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private static async Task<Dictionary<string, (GroceryListItemDto Item, string Section)>> Preview(HttpClient client, DateOnly monday)
    {
        var list = await client.GetJson<GroceryListDto>($"/api/grocerylists/preview?from={monday:yyyy-MM-dd}&to={monday.AddDays(6):yyyy-MM-dd}");
        return list.Sections
            .SelectMany(section => section.Items.Select(item => (Item: item, Section: section.Name)))
            .ToDictionary(entry => entry.Item.IngredientName);
    }

    private static async Task Plan(HttpClient client, DateOnly date, string slot, int recipeId, decimal portions) =>
        await (await client.PostJson("/api/mealplans", MealEntry(date, slot, PlannedRecipe(recipeId, portions))))
            .EnsureStatus(HttpStatusCode.Created);

    [Fact]
    public async Task Grams_and_kilograms_of_one_ingredient_become_one_line()
    {
        var potatoes = await CreateIngredient(client, "SL potatoes", "RootVegetable");
        var milk = await CreateIngredient(client, "SL milk", "Dairy");
        var small = await CreateRecipe(client, Recipe("SL mash", 2, [Line(potatoes.IngredientId, 200), Line(milk.IngredientId, 300, "Milliliter")]));
        var large = await CreateRecipe(client, Recipe("SL gratin", 2, [Line(potatoes.IngredientId, 1, "Kilogram"), Line(milk.IngredientId, 1, "Liter")]));
        var monday = new DateOnly(2034, 2, 6);
        await Plan(client, monday, "Dinner", small.RecipeId, 2);
        await Plan(client, monday.AddDays(1), "Dinner", large.RecipeId, 2);

        var list = await client.GetJson<GroceryListDto>($"/api/grocerylists/preview?from={monday:yyyy-MM-dd}&to={monday.AddDays(6):yyyy-MM-dd}");
        var lines = list.Sections.SelectMany(section => section.Items).ToList();

        var potatoLine = Assert.Single(lines, item => item.IngredientName == "SL potatoes");
        Assert.Equal(1.2m, potatoLine.Amount);
        Assert.Equal(MeasurementUnit.Kilogram, potatoLine.Unit);
        Assert.Equal("1.2 kg", potatoLine.DisplayAmount);
        var milkLine = Assert.Single(lines, item => item.IngredientName == "SL milk");
        Assert.Equal("1.3 l", milkLine.DisplayAmount);
    }

    [Fact]
    public async Task Totals_are_rounded_up_to_shop_sized_steps()
    {
        var tomatoes = await CreateIngredient(client, "SL canned tomatoes", "Vegetable");
        var cumin = await CreateIngredient(client, "SL cumin", "Spice");
        // 2 of 3 portions: 1100 g x 2/3 = 733.33 g and 4 g x 2/3 = 2.67 g.
        var stew = await CreateRecipe(client, Recipe("SL stew", 3, [Line(tomatoes.IngredientId, 1100), Line(cumin.IngredientId, 4)]));
        var monday = new DateOnly(2034, 2, 13);
        await Plan(client, monday, "Dinner", stew.RecipeId, 2);

        var items = await Preview(client, monday);

        Assert.Equal("750 g", items["SL canned tomatoes"].Item.DisplayAmount);
        Assert.Equal(750m, items["SL canned tomatoes"].Item.Amount);
        Assert.Equal("3 g", items["SL cumin"].Item.DisplayAmount);
    }

    [Theory]
    [InlineData(0.4, 1, MeasurementUnit.Gram)]
    [InlineData(2.67, 3, MeasurementUnit.Gram)]
    [InlineData(10, 10, MeasurementUnit.Gram)]
    [InlineData(33.3, 35, MeasurementUnit.Gram)]
    [InlineData(183, 190, MeasurementUnit.Gram)]
    [InlineData(250.31, 260, MeasurementUnit.Gram)]
    [InlineData(733.33, 750, MeasurementUnit.Gram)]
    [InlineData(1000, 1, MeasurementUnit.Kilogram)]
    [InlineData(1210, 1.25, MeasurementUnit.Kilogram)]
    public void The_rounding_steps(double total, double expected, MeasurementUnit expectedUnit)
    {
        var (amount, unit) = GroceryListService.ToShopAmount((decimal)total, MeasurementUnit.Gram);
        Assert.Equal((decimal)expected, amount);
        Assert.Equal(expectedUnit, unit);
    }

    [Fact]
    public async Task A_tag_in_a_section_named_category_picks_the_section_without_a_known_tag_name()
    {
        var tag = await client.PostJson("/api/ingredient-tag-categories/1/tags", new { name = "SL Squash" });
        Assert.True(tag.IsSuccessStatusCode);
        var squash = await CreateIngredient(client, "SL butternut", "SL Squash");
        var soup = await CreateRecipe(client, Recipe("SL soup", 2, [Line(squash.IngredientId, 500)]));
        var monday = new DateOnly(2034, 2, 20);
        await Plan(client, monday, "Dinner", soup.RecipeId, 2);

        Assert.Equal("Produce", (await Preview(client, monday))["SL butternut"].Section);
    }

    [Fact]
    public async Task Renamed_tags_keep_their_section()
    {
        // Renames shared tags, so it gets a database of its own.
        using var ownFactory = new MatfloteFactory();
        var own = ownFactory.CreateClient();
        foreach (var (from, to) in new[] { ("Vegetable", "Grønnsak"), ("Dairy", "Meieri"), ("Chicken", "Kylling") })
        {
            await (await own.PutJson($"/api/ingredient-tag-categories/tags/{from}", new { name = to })).EnsureStatus(HttpStatusCode.NoContent);
        }

        var carrot = await CreateIngredient(own, "SL carrot", "Grønnsak");
        var cream = await CreateIngredient(own, "SL cream", "Meieri");
        var chicken = await CreateIngredient(own, "SL chicken", "Kylling");
        var dinner = await CreateRecipe(own, Recipe("SL dinner", 2, [Line(carrot.IngredientId, 100), Line(cream.IngredientId, 100), Line(chicken.IngredientId, 100)]));
        var monday = new DateOnly(2034, 2, 27);
        await Plan(own, monday, "Dinner", dinner.RecipeId, 2);

        var items = await Preview(own, monday);
        Assert.Equal("Produce", items["SL carrot"].Section);
        Assert.Equal("Dairy", items["SL cream"].Section);
        Assert.Equal("Protein", items["SL chicken"].Section);
    }
}
