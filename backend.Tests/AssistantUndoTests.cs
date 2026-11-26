using System.Net;
using System.Text.Json;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>
/// The write log and undo. Undo always takes the newest meal plan write that has not been undone, so every test
/// undoes only the writes it made itself (tests in one class run one after another).
/// </summary>
public class AssistantUndoTests : IClassFixture<MatfloteFactory>, IAsyncLifetime
{
    private readonly HttpClient client;

    public AssistantUndoTests(MatfloteFactory factory)
    {
        client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        await client.Import(new
        {
            recipes = new object[]
            {
                new { name = "UN fish", portions = 4, tags = new[] { "Dinner", "Fish" }, ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } },
                new { name = "UN pasta", portions = 2, tags = new[] { "Dinner" }, ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } },
                new { name = "UN soup", portions = 2, tags = new[] { "Lunch" }, ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } },
            },
        });
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private static object Meal(DateOnly date, string slot, string recipe, decimal? portions = null, string? notes = null) =>
        new { date, slot, notes, items = new[] { new { recipe, portions } } };

    private async Task<Dictionary<string, string>> Plan(DateOnly from, DateOnly to)
    {
        var plan = await client.MealPlan(from, to);
        return plan.GetProperty("entries").EnumerateArray().ToDictionary(
            entry => $"{entry.GetProperty("date").GetString()} {entry.GetProperty("slot").GetString()}",
            entry => string.Join(" + ", entry.GetProperty("items").EnumerateArray().Select(item =>
                    $"{item.GetProperty("recipe").GetString()} x{item.GetProperty("portions").GetDecimal():0.##} {item.GetProperty("role").GetString()}"))
                + (entry.TryGetProperty("notes", out var notes) ? $" ({notes.GetString()})" : ""));
    }

    private async Task<JsonElement> Undo(object? body = null, HttpStatusCode expected = HttpStatusCode.OK)
    {
        var response = body is null
            ? await client.PostAsync("/api/assistant/meal-plan/undo", null)
            : await client.PostJson("/api/assistant/meal-plan/undo", body);
        await response.EnsureStatus(expected);
        return await response.ReadJson();
    }

    private Task<JsonElement> Log(int limit = 10) => client.GetJson<JsonElement>($"/api/assistant/log?limit={limit}");

    private async Task<int> RecipeId(string name) => (await client.Context()).FindRecipe(name)!.Value.GetProperty("id").GetInt32();

    [Fact]
    public async Task Undo_puts_back_exactly_what_a_replace_overwrote()
    {
        var monday = new DateOnly(2040, 1, 2);
        // Planned in the web app: pasta with a note, and a lunch the assistant does not touch.
        await (await client.PostJson("/api/mealplans", new
        {
            date = monday,
            slot = "Dinner",
            notes = "Guests",
            recipes = new[] { PlannedRecipe(await RecipeId("UN pasta"), 6) },
        })).EnsureStatus(HttpStatusCode.Created);
        await client.PlanMeals(new { entries = new[] { Meal(monday, "Lunch", "UN soup") } });
        var before = await Plan(monday, monday.AddDays(6));

        await client.PlanMeals(new
        {
            entries = new[] { Meal(monday, "Dinner", "UN fish", 2), Meal(monday.AddDays(1), "Dinner", "UN fish", 2) },
        });

        var result = await Undo();

        Assert.True(result.GetProperty("applied").GetBoolean());
        var slots = result.GetProperty("slots").EnumerateArray().ToList();
        Assert.Equal(["restored", "cleared"], slots.Select(slot => slot.Status()).ToArray());
        Assert.Equal(["UN pasta × 6"], slots[0].Strings("items"));
        Assert.Equal(before, await Plan(monday, monday.AddDays(6)));

        // Clean up the lunch written above, so later tests start from an empty undo stack.
        await Undo();
    }

    [Fact]
    public async Task Successive_writes_are_undone_newest_first()
    {
        var day = new DateOnly(2040, 2, 6);
        var empty = await Plan(day, day);

        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", "UN fish") } });
        var afterFirst = await Plan(day, day);
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", "UN pasta") } });

        var second = await Undo();
        Assert.Equal(afterFirst, await Plan(day, day));
        Assert.Contains("1 replaced", second.GetProperty("undoneWriteSummary").GetString());

        await Undo();
        Assert.Equal(empty, await Plan(day, day));

        var log = (await Log(4)).EnumerateArray().ToList();
        Assert.Equal(
            ["POST /api/assistant/meal-plan/undo", "POST /api/assistant/meal-plan/undo", "PUT /api/assistant/meal-plan", "PUT /api/assistant/meal-plan"],
            log.Select(row => row.GetProperty("endpoint").GetString()!).ToArray());
        Assert.All(log.Skip(2), row => Assert.True(row.TryGetProperty("undoneAt", out _)));
        Assert.All(log, row => Assert.False(row.GetProperty("canUndo").GetBoolean()));
    }

    [Fact]
    public async Task Fill_and_clear_range_restore_only_the_slots_they_changed()
    {
        var monday = new DateOnly(2040, 3, 5);
        await client.PlanMeals(new { entries = new[] { Meal(monday, "Dinner", "UN pasta"), Meal(monday.AddDays(2), "Lunch", "UN soup") } });
        var before = await Plan(monday, monday.AddDays(6));

        // Fill skips Monday's planned dinner; clearRange empties Wednesday's lunch, which is not listed.
        var write = await client.PlanMeals(new
        {
            mode = "fill",
            clearRange = new { from = monday, to = monday.AddDays(6) },
            entries = new[] { Meal(monday, "Dinner", "UN fish"), Meal(monday.AddDays(1), "Dinner", "UN fish") },
        });
        Assert.Equal(["skipped", "created", "cleared"], write.GetProperty("entries").EnumerateArray().Select(row => row.Status()).ToArray());

        var undo = await Undo();

        Assert.Equal(2, undo.GetProperty("slots").GetArrayLength());
        Assert.Equal(before, await Plan(monday, monday.AddDays(6)));
        await Undo();
    }

    [Fact]
    public async Task A_slot_changed_since_the_write_blocks_undo_unless_forced()
    {
        var day = new DateOnly(2040, 4, 2);
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", "UN fish") } });
        var entryId = (await client.GetJson<JsonElement>($"/api/mealplans?from={day:yyyy-MM-dd}&to={day:yyyy-MM-dd}"))[0].GetProperty("mealPlanEntryId").GetInt32();
        // The person changes the portions in the web app afterwards.
        await (await client.PutJson($"/api/mealplans/{entryId}", MealEntry(day, "Dinner", PlannedRecipe(await RecipeId("UN fish"), 3)))).EnsureStatus(HttpStatusCode.OK);
        var edited = await Plan(day, day);

        var refused = await Undo(expected: HttpStatusCode.Conflict);
        Assert.False(refused.GetProperty("applied").GetBoolean());
        Assert.Contains("were changed after write", string.Join(" ", refused.Strings("errors")));
        Assert.Equal("changed_since", refused.GetProperty("slots")[0].Status());
        Assert.Equal(edited, await Plan(day, day));

        var forced = await Undo(new { force = true });
        Assert.True(forced.GetProperty("applied").GetBoolean());
        Assert.Empty(await Plan(day, day));
    }

    [Fact]
    public async Task A_dry_run_undo_reports_and_changes_nothing()
    {
        var day = new DateOnly(2040, 5, 7);
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", "UN fish") } });

        var dryRun = await Undo(new { dryRun = true });
        Assert.False(dryRun.GetProperty("applied").GetBoolean());
        Assert.Equal("would_clear", dryRun.GetProperty("slots")[0].Status());
        Assert.Single(await Plan(day, day));
        Assert.True((await Log(1))[0].GetProperty("isNextUndo").GetBoolean());

        await Undo(new { });
        Assert.Empty(await Plan(day, day));
    }

    [Fact]
    public async Task A_recipe_deleted_since_cannot_come_back_and_says_so()
    {
        var day = new DateOnly(2040, 6, 4);
        await client.Import(new { recipes = new[] { new { name = "UN doomed", portions = 2, tags = new[] { "Dinner" }, ingredients = Array.Empty<object>() } } });
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", "UN doomed") } });
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", "UN fish") } });
        await (await client.DeleteAsync($"/api/recipes/{await RecipeId("UN doomed")}")).EnsureStatus(HttpStatusCode.NoContent);

        var undo = await Undo();

        var slot = undo.GetProperty("slots")[0];
        Assert.Equal("cleared", slot.Status());
        Assert.Contains("no longer exists", string.Join(" ", slot.Strings("warnings")));
        Assert.Empty(await Plan(day, day));
        // The earlier write, of the deleted recipe, is next. The slot is already as it was before that write
        // (empty), so this is not a conflict.
        var earlier = await Undo();
        Assert.Equal("cleared", earlier.GetProperty("slots")[0].Status());
        Assert.Empty(await Plan(day, day));
    }

    [Fact]
    public async Task Dry_runs_rejected_writes_and_imports_are_logged_correctly()
    {
        var day = new DateOnly(2040, 7, 2);
        var newestBefore = (await Log(1))[0].GetProperty("id").GetInt32();

        await client.PlanMeals(new { dryRun = true, entries = new[] { Meal(day, "Dinner", "UN fish") } });
        await client.PlanMeals(new { entries = new[] { Meal(day, "Dinner", "UN nothing") } }, HttpStatusCode.UnprocessableEntity);
        await client.Import(new { dryRun = true, recipes = new[] { new { name = "UN dry", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>() } } });
        Assert.Equal(newestBefore, (await Log(1))[0].GetProperty("id").GetInt32());

        await client.Import(new
        {
            ingredients = new[] { new { name = "UN new ingredient", tags = new[] { "Vegetable" } } },
            recipes = new[] { new { name = "UN logged", portions = 2, tags = new[] { "Dinner" }, ingredients = new[] { new { name = "UN new ingredient", amount = 10, unit = "g" } } } },
        });

        var row = (await Log(1))[0];
        Assert.Equal("POST /api/assistant/recipes", row.GetProperty("endpoint").GetString());
        Assert.Equal("Created recipes UN logged; created ingredients UN new ingredient.", row.GetProperty("summary").GetString());
        Assert.Equal(1, row.GetProperty("counts").GetProperty("recipesCreated").GetInt32());
        Assert.Equal(1, row.GetProperty("counts").GetProperty("ingredientsCreated").GetInt32());
        Assert.False(row.GetProperty("counts").TryGetProperty("recipesUpdated", out _));
        Assert.False(row.GetProperty("canUndo").GetBoolean());
    }

    [Fact]
    public async Task Unknown_undo_options_are_rejected()
    {
        var response = await client.PostJson("/api/assistant/meal-plan/undo", new { forse = true });
        await response.EnsureStatus(HttpStatusCode.BadRequest);
    }
}

public class AssistantUndoEmptyTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    [Fact]
    public async Task With_no_meal_plan_write_there_is_nothing_to_undo()
    {
        var client = factory.CreateClient();
        await client.Import(new { recipes = new[] { new { name = "UE only", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>() } } });

        var response = await client.PostAsync("/api/assistant/meal-plan/undo", null);

        await response.EnsureStatus(HttpStatusCode.NotFound);
        Assert.Contains("no meal plan write to undo", string.Join(" ", (await response.ReadJson()).Strings("errors")));
    }
}
