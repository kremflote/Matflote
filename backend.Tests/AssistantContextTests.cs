using System.Net;

namespace DinnerPlanner.Api.Tests;

public class AssistantContextTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task The_guide_is_served_as_markdown()
    {
        var response = await client.GetAsync("/api/assistant");
        await response.EnsureStatus(HttpStatusCode.OK);
        Assert.Equal("text/markdown", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("GET /api/assistant/context", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Context_lists_vocabulary_tags_and_catalog()
    {
        var context = await client.Context();

        var today = DateOnly.FromDateTime(DateTime.Now);
        Assert.Equal(today, DateOnly.Parse(context.GetProperty("serverDate").GetString()!));
        var weekStart = DateOnly.Parse(context.GetProperty("weekStart").GetString()!);
        Assert.Equal(DayOfWeek.Monday, weekStart.DayOfWeek);
        Assert.InRange(today.DayNumber - weekStart.DayNumber, 0, 6);
        Assert.Equal(56, context.GetProperty("historyDays").GetInt32());

        var vocabulary = context.GetProperty("vocabulary");
        Assert.Equal(["g", "kg", "ml", "l"], vocabulary.Strings("units"));
        Assert.Equal(["Breakfast", "Lunch", "Dinner", "Snack1", "Snack2"], vocabulary.Strings("mealSlots"));
        Assert.Equal(["Main", "Sauce", "Side", "Extra"], vocabulary.Strings("mealRoles"));
        Assert.DoesNotContain("None", vocabulary.Strings("preparations"));
        Assert.Equal(30, vocabulary.GetProperty("limits").GetProperty("recipeNameMaxLength").GetInt32());

        var meal = context.GetProperty("tagCategories").EnumerateArray()
            .Single(category => category.GetProperty("category").GetString() == "Meal");
        Assert.Contains("Dinner", meal.Strings("tags"));

        // Rows seeded by the migrations are listed.
        Assert.NotNull(context.FindRecipe("Chicken rice bowl"));
        Assert.NotNull(context.FindIngredient("Garlic"));
    }

    [Fact]
    public async Task Context_reports_how_recently_a_recipe_was_planned()
    {
        await client.Import(new
        {
            recipes = new[]
            {
                new { name = "CX history dish", portions = 2, tags = new[] { "Dinner" }, ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } },
                new { name = "CX never planned", portions = 2, tags = new[] { "Dinner" }, ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } },
            },
        });

        var today = DateOnly.FromDateTime(DateTime.Now);
        await client.PlanMeals(new
        {
            entries = new object[]
            {
                new { date = today.AddDays(-10), slot = "Dinner", items = new[] { new { recipe = "CX history dish" } } },
                new { date = today.AddDays(-3), slot = "Dinner", items = new[] { new { recipe = "CX history dish" } } },
                // Outside the default 56-day window: counted for lastPlanned only if it is the latest, which it is not.
                new { date = today.AddDays(-100), slot = "Dinner", items = new[] { new { recipe = "CX history dish" } } },
                // In the future: ignored by both numbers.
                new { date = today.AddDays(5), slot = "Dinner", items = new[] { new { recipe = "CX history dish" } } },
            },
        });

        var context = await client.Context();
        var planned = context.FindRecipe("CX history dish")!.Value;
        Assert.Equal(2, planned.GetProperty("plannedCount").GetInt32());
        Assert.Equal(today.AddDays(-3), DateOnly.Parse(planned.GetProperty("lastPlanned").GetString()!));
        Assert.Equal(["Dinner"], planned.Strings("tags"));
        Assert.Equal(["Rice"], planned.Strings("ingredients"));

        var never = context.FindRecipe("CX never planned")!.Value;
        Assert.Equal(0, never.GetProperty("plannedCount").GetInt32());
        Assert.False(never.TryGetProperty("lastPlanned", out _));

        var wide = await client.GetJson<System.Text.Json.JsonElement>("/api/assistant/context?historyDays=200");
        Assert.Equal(3, wide.FindRecipe("CX history dish")!.Value.GetProperty("plannedCount").GetInt32());
    }
}
