using System.Net;
using System.Text.Json;
using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Tests;

public class AssistantMealPlanTests : IClassFixture<MatfloteFactory>, IAsyncLifetime
{
    private readonly HttpClient client;

    public AssistantMealPlanTests(MatfloteFactory factory)
    {
        client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        // Idempotent: later runs in the same class skip the existing rows.
        await client.Import(new
        {
            recipes = new object[]
            {
                new { name = "AM salmon", portions = 4, tags = new[] { "Dinner", "Fish" }, ingredients = new[] { new { name = "AM salmon fillet", amount = 600, unit = "g" } } },
                new { name = "AM soup", portions = 2, tags = new[] { "Dinner" }, ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } },
                new { name = "AM sauce", portions = 1, tags = Array.Empty<string>(), ingredients = new[] { new { name = "Greek yogurt", amount = 100, unit = "g" } } },
            },
        });
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private static object Meal(DateOnly date, string slot, params object[] items) => new { date, slot, items };

    private static object RecipeItem(string recipe, decimal? portions = null, string? role = null) => new { recipe, portions, role };

    private async Task<JsonElement[]> Entries(DateOnly from, DateOnly to) =>
        (await client.MealPlan(from, to)).GetProperty("entries").EnumerateArray().ToArray();

    private static JsonElement Row(JsonElement result, DateOnly date, string slot) =>
        result.GetProperty("entries").EnumerateArray().Single(entry =>
            entry.GetProperty("date").GetString() == date.ToString("yyyy-MM-dd") && entry.GetProperty("slot").GetString() == slot);

    [Fact]
    public async Task Replace_creates_and_then_overwrites_a_slot()
    {
        var day = new DateOnly(2033, 1, 3);

        var created = await client.PlanMeals(new
        {
            entries = new[]
            {
                new
                {
                    date = day,
                    slot = "dinner",
                    notes = "Guests",
                    items = new object[] { RecipeItem("am salmon"), RecipeItem("AM sauce", 1) },
                },
            },
        });
        Assert.True(created.GetProperty("applied").GetBoolean());
        var row = Row(created, day, "Dinner");
        Assert.Equal("created", row.Status());

        var entry = Assert.Single(await Entries(day, day));
        Assert.Equal("Monday", entry.GetProperty("weekday").GetString());
        Assert.Equal("Guests", entry.GetProperty("notes").GetString());
        var items = entry.GetProperty("items").EnumerateArray().ToArray();
        Assert.Equal("AM salmon", items[0].GetProperty("recipe").GetString());
        // Portions default to the recipe's own count; the first item is Main, the rest Side.
        Assert.Equal(4m, items[0].GetProperty("portions").GetDecimal());
        Assert.Equal("Main", items[0].GetProperty("role").GetString());
        Assert.Equal("Side", items[1].GetProperty("role").GetString());

        var replaced = await client.PlanMeals(new
        {
            entries = new[] { Meal(day, "Dinner", RecipeItem("AM soup", 3), new { ingredient = "Lemon", amount = 50, unit = "g" }) },
        });
        Assert.Equal("replaced", Row(replaced, day, "Dinner").Status());

        var after = Assert.Single(await Entries(day, day));
        Assert.False(after.TryGetProperty("notes", out _));
        var afterItems = after.GetProperty("items").EnumerateArray().ToArray();
        Assert.Equal(2, afterItems.Length);
        Assert.Equal("AM soup", afterItems[0].GetProperty("recipe").GetString());
        Assert.Equal(3m, afterItems[0].GetProperty("portions").GetDecimal());
        Assert.Equal("Lemon", afterItems[1].GetProperty("ingredient").GetString());
        Assert.Equal(50m, afterItems[1].GetProperty("amount").GetDecimal());
        Assert.Equal("g", afterItems[1].GetProperty("unit").GetString());

        // The regular API sees the same single entry.
        var regular = await client.GetJson<List<MealPlanEntryDto>>($"/api/mealplans?from={day:yyyy-MM-dd}&to={day:yyyy-MM-dd}");
        Assert.Equal(2, Assert.Single(regular).Recipes.Count);
    }

    [Fact]
    public async Task Fill_leaves_planned_slots_alone()
    {
        var day = new DateOnly(2033, 2, 7);
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", RecipeItem("AM salmon")) } });

        var result = await client.PlanMeals(new
        {
            mode = "fill",
            entries = new[] { Meal(day, "Dinner", RecipeItem("AM soup")), Meal(day, "Lunch", RecipeItem("AM soup")) },
        });

        Assert.Equal("skipped", Row(result, day, "Dinner").Status());
        Assert.Equal("created", Row(result, day, "Lunch").Status());
        var entries = await Entries(day, day);
        Assert.Equal(2, entries.Length);
        var dinner = entries.Single(entry => entry.GetProperty("slot").GetString() == "Dinner");
        Assert.Equal("AM salmon", dinner.GetProperty("items")[0].GetProperty("recipe").GetString());
    }

    [Fact]
    public async Task ClearRange_removes_meals_not_listed_and_keeps_those_outside_the_range()
    {
        var monday = new DateOnly(2033, 3, 7);
        var sunday = monday.AddDays(6);
        await client.PlanMeals(new
        {
            entries = new[]
            {
                Meal(monday, "Dinner", RecipeItem("AM salmon")),
                Meal(monday.AddDays(2), "Dinner", RecipeItem("AM soup")),
                Meal(sunday, "Lunch", RecipeItem("AM soup")),
                Meal(sunday.AddDays(1), "Dinner", RecipeItem("AM soup")),
            },
        });

        var result = await client.PlanMeals(new
        {
            clearRange = new { from = monday, to = sunday },
            entries = new[] { Meal(monday, "Dinner", RecipeItem("AM soup")) },
        });

        Assert.Equal("replaced", Row(result, monday, "Dinner").Status());
        Assert.Equal("cleared", Row(result, monday.AddDays(2), "Dinner").Status());
        Assert.Equal("cleared", Row(result, sunday, "Lunch").Status());

        var week = Assert.Single(await Entries(monday, sunday));
        Assert.Equal("AM soup", week.GetProperty("items")[0].GetProperty("recipe").GetString());
        Assert.Single(await Entries(sunday.AddDays(1), sunday.AddDays(1)));
    }

    [Fact]
    public async Task ClearRange_alone_empties_the_range()
    {
        var monday = new DateOnly(2033, 4, 4);
        await client.PlanMeals(new { entries = new[] { Meal(monday, "Dinner", RecipeItem("AM soup")), Meal(monday.AddDays(1), "Breakfast", RecipeItem("AM soup")) } });

        var result = await client.PlanMeals(new { clearRange = new { from = monday, to = monday.AddDays(6) } });

        Assert.Equal(2, result.GetProperty("entries").GetArrayLength());
        Assert.Empty(await Entries(monday, monday.AddDays(6)));
    }

    [Fact]
    public async Task An_entry_with_no_items_clears_its_slot()
    {
        var day = new DateOnly(2033, 5, 2);
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", RecipeItem("AM soup")) } });

        var result = await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner"), Meal(day, "Lunch") } });

        Assert.Equal("cleared", Row(result, day, "Dinner").Status());
        Assert.Equal("unchanged", Row(result, day, "Lunch").Status());
        Assert.Empty(await Entries(day, day));
    }

    [Fact]
    public async Task A_dry_run_writes_nothing()
    {
        var day = new DateOnly(2033, 6, 6);
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", RecipeItem("AM soup")) } });

        var result = await client.PlanMeals(new
        {
            dryRun = true,
            clearRange = new { from = day, to = day.AddDays(1) },
            entries = new[] { Meal(day.AddDays(1), "Dinner", RecipeItem("AM salmon")) },
        });

        Assert.True(result.GetProperty("dryRun").GetBoolean());
        Assert.False(result.GetProperty("applied").GetBoolean());
        Assert.Equal("would_create", Row(result, day.AddDays(1), "Dinner").Status());
        Assert.Equal("would_clear", Row(result, day, "Dinner").Status());

        var entries = await Entries(day, day.AddDays(1));
        var only = Assert.Single(entries);
        Assert.Equal(day.ToString("yyyy-MM-dd"), only.GetProperty("date").GetString());
    }

    [Fact]
    public async Task A_meal_can_refer_to_a_recipe_by_id()
    {
        var context = await client.Context();
        var id = context.FindRecipe("AM soup")!.Value.GetProperty("id").GetInt32();
        var day = new DateOnly(2033, 7, 4);

        var result = await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", new { recipeId = id, portions = 1 }) } });

        Assert.Equal("created", Row(result, day, "Dinner").Status());
        Assert.Equal(id, (await Entries(day, day))[0].GetProperty("items")[0].GetProperty("recipeId").GetInt32());
    }

    // ---------- errors ----------

    private static readonly DateOnly ErrorDay = new(2034, 1, 2);

    public static TheoryData<string, object, string> InvalidPlans() => new()
    {
        { "nothing to do", new { entries = Array.Empty<object>() }, "Nothing to do" },
        { "invalid mode", new { mode = "merge", entries = new[] { Meal(ErrorDay, "Dinner", RecipeItem("AM soup")) } }, "mode \"merge\" is not valid" },
        { "reversed clearRange", new { clearRange = new { from = ErrorDay.AddDays(1), to = ErrorDay } }, "clearRange.from must be on or before clearRange.to" },
        { "clearRange too long", new { clearRange = new { from = ErrorDay, to = ErrorDay.AddDays(62) } }, "at most 62 days" },
        { "invalid slot", new { entries = new[] { Meal(ErrorDay, "Supper", RecipeItem("AM soup")) } }, "slot \"Supper\" is not valid" },
        { "duplicate slot", new { entries = new[] { Meal(ErrorDay, "Dinner", RecipeItem("AM soup")), Meal(ErrorDay, "dinner", RecipeItem("AM salmon")) } }, "appears more than once" },
        { "notes too long", new { entries = new[] { new { date = ErrorDay, slot = "Dinner", notes = new string('n', 501), items = new[] { RecipeItem("AM soup") } } } }, "the maximum is 500" },
        { "unknown recipe", new { entries = new[] { Meal(ErrorDay, "Dinner", RecipeItem("AM salmn")) } }, "Did you mean \"AM salmon\"" },
        { "unknown recipe id", new { entries = new[] { Meal(ErrorDay, "Dinner", new { recipeId = 987654 }) } }, "Recipe id 987654 does not exist" },
        { "unknown ingredient", new { entries = new[] { Meal(ErrorDay, "Snack1", new { ingredient = "AM nothing like it", amount = 10, unit = "g" }) } }, "does not exist" },
        { "recipe and ingredient", new { entries = new[] { Meal(ErrorDay, "Dinner", new { recipe = "AM soup", ingredient = "Lemon", amount = 10, unit = "g" }) } }, "exactly one of" },
        { "neither recipe nor ingredient", new { entries = new[] { Meal(ErrorDay, "Dinner", new { portions = 2 }) } }, "exactly one of" },
        { "zero portions", new { entries = new[] { Meal(ErrorDay, "Dinner", RecipeItem("AM soup", 0)) } }, "portions must be greater than 0" },
        { "invalid role", new { entries = new[] { Meal(ErrorDay, "Dinner", RecipeItem("AM soup", role: "Dessert")) } }, "role \"Dessert\" is not valid" },
        { "ingredient without amount", new { entries = new[] { Meal(ErrorDay, "Snack1", new { ingredient = "Lemon", unit = "g" }) } }, "amount is required" },
        { "ingredient with piece unit", new { entries = new[] { Meal(ErrorDay, "Snack1", new { ingredient = "Lemon", amount = 1, unit = "stk" }) } }, "unit \"stk\" is not supported" },
    };

    [Theory]
    [MemberData(nameof(InvalidPlans))]
    public async Task Invalid_plans_are_rejected_with_422_and_write_nothing(string scenario, object body, string expectedError)
    {
        var result = await client.PlanMeals(body, HttpStatusCode.UnprocessableEntity);

        Assert.False(result.GetProperty("applied").GetBoolean());
        Assert.True(result.AllErrors().Contains(expectedError, StringComparison.Ordinal), $"{scenario}: expected an error containing '{expectedError}', got:\n{result.AllErrors()}");
        Assert.Empty(await Entries(ErrorDay, ErrorDay.AddDays(62)));
    }

    [Fact]
    public async Task One_bad_entry_stops_the_whole_request()
    {
        var day = new DateOnly(2034, 6, 5);

        var result = await client.PlanMeals(
            new { entries = new[] { Meal(day, "Dinner", RecipeItem("AM soup")), Meal(day, "Lunch", RecipeItem("AM missing")) } },
            HttpStatusCode.UnprocessableEntity);

        Assert.Equal("would_create", Row(result, day, "Dinner").Status());
        Assert.Equal("error", Row(result, day, "Lunch").Status());
        Assert.Empty(await Entries(day, day));
    }

    [Fact]
    public async Task Unknown_json_properties_are_rejected_with_400()
    {
        var day = new DateOnly(2034, 7, 3);
        var response = await client.PutJson("/api/assistant/meal-plan", new
        {
            entries = new[] { new { date = day, slot = "Dinner", items = new[] { new { recipe = "AM soup", servings = 2 } } } },
        });

        await response.EnsureStatus(HttpStatusCode.BadRequest);
        Assert.Empty(await Entries(day, day));
    }

    [Fact]
    public async Task Reading_a_reversed_range_is_400()
    {
        var response = await client.GetAsync("/api/assistant/meal-plan?from=2034-01-10&to=2034-01-01");
        await response.EnsureStatus(HttpStatusCode.BadRequest);
    }
}
