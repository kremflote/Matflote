using System.Net;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class MealPlanBatchTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private static readonly string[] Slots = ["Breakfast", "Lunch", "Dinner"];

    private readonly HttpClient client = factory.CreateClient();

    private async Task<(RecipeDto First, RecipeDto Second)> TwoRecipes(string prefix)
    {
        var rice = await CreateIngredient(client, $"{prefix} rice", "Grain");
        var first = await CreateRecipe(client, Recipe($"{prefix} one", 2, [Line(rice.IngredientId, 200)]));
        var second = await CreateRecipe(client, Recipe($"{prefix} two", 4, [Line(rice.IngredientId, 400)]));
        return (first, second);
    }

    private Task<List<MealPlanEntryDto>> Range(DateOnly from, DateOnly to) =>
        client.GetJson<List<MealPlanEntryDto>>($"/api/mealplans?from={from:yyyy-MM-dd}&to={to:yyyy-MM-dd}");

    private async Task<MealPlanEntryDto> Create(DateOnly date, string slot, int recipeId, decimal portions = 2)
    {
        var response = await client.PostJson("/api/mealplans", MealEntry(date, slot, PlannedRecipe(recipeId, portions)));
        await response.EnsureStatus(HttpStatusCode.Created);
        return await response.Read<MealPlanEntryDto>();
    }

    private async Task<MealPlanBatchResultDto> Batch(object body)
    {
        var response = await client.PutJson("/api/mealplans/batch", body);
        await response.EnsureStatus(HttpStatusCode.OK);
        return await response.Read<MealPlanBatchResultDto>();
    }

    private async Task<string> BatchError(object body)
    {
        var response = await client.PutJson("/api/mealplans/batch", body);
        await response.EnsureStatus(HttpStatusCode.BadRequest);
        return await response.Content.ReadAsStringAsync();
    }

    [Fact]
    public async Task A_whole_week_is_written_in_one_request()
    {
        var (first, second) = await TwoRecipes("MB week");
        var monday = new DateOnly(2032, 1, 5);
        var upsert = Enumerable.Range(0, 7)
            .SelectMany(day => Slots.Select(slot => MealEntry(monday.AddDays(day), slot, PlannedRecipe(day % 2 == 0 ? first.RecipeId : second.RecipeId, 2))))
            .ToArray();

        var result = await Batch(new { upsert });

        Assert.Equal(monday, result.From);
        Assert.Equal(monday.AddDays(6), result.To);
        Assert.Equal(21, result.Entries.Count);
        Assert.Equal(21, (await Range(monday, monday.AddDays(6))).Count);
    }

    [Fact]
    public async Task Upsert_replaces_by_date_and_slot_and_keeps_the_entry()
    {
        var (first, second) = await TwoRecipes("MB replace");
        var date = new DateOnly(2032, 2, 2);
        var existing = await Create(date, "Dinner", first.RecipeId);

        var result = await Batch(new
        {
            upsert = new[]
            {
                MealEntry(date, "Dinner", PlannedRecipe(second.RecipeId, 3)),
                MealEntry(date, "Lunch", PlannedRecipe(first.RecipeId, 1)),
            },
        });

        Assert.Equal(date, result.From);
        Assert.Equal(date, result.To);
        Assert.Equal(2, result.Entries.Count);
        var dinner = Assert.Single(result.Entries, entry => entry.Slot.ToString() == "Dinner");
        Assert.Equal(existing.MealPlanEntryId, dinner.MealPlanEntryId);
        var item = Assert.Single(dinner.Recipes);
        Assert.Equal(second.RecipeId, item.RecipeId);
        Assert.Equal(3m, item.Portions);
    }

    [Fact]
    public async Task An_upsert_without_items_empties_the_slot()
    {
        var (first, _) = await TwoRecipes("MB empty");
        var date = new DateOnly(2032, 3, 1);
        await Create(date, "Breakfast", first.RecipeId);

        var result = await Batch(new { upsert = new[] { MealEntry(date, "Breakfast") } });

        Assert.Empty(result.Entries);
        Assert.Empty(await Range(date, date));
    }

    [Fact]
    public async Task Move_is_one_upsert_and_one_delete()
    {
        var (first, _) = await TwoRecipes("MB move");
        var monday = new DateOnly(2032, 4, 5);
        var source = await Create(monday, "Dinner", first.RecipeId);

        var result = await Batch(new
        {
            upsert = new[] { MealEntry(monday.AddDays(2), "Lunch", PlannedRecipe(first.RecipeId, 2)) },
            delete = new[] { source.MealPlanEntryId },
        });

        Assert.Equal(monday, result.From);
        Assert.Equal(monday.AddDays(2), result.To);
        var moved = Assert.Single(result.Entries);
        Assert.Equal(monday.AddDays(2), moved.Date);
        Assert.Equal("Lunch", moved.Slot.ToString());
    }

    [Fact]
    public async Task Swap_is_two_upserts()
    {
        var (first, second) = await TwoRecipes("MB swap");
        var date = new DateOnly(2032, 5, 3);
        await Create(date, "Lunch", first.RecipeId);
        await Create(date, "Dinner", second.RecipeId);

        var result = await Batch(new
        {
            upsert = new[]
            {
                MealEntry(date, "Lunch", PlannedRecipe(second.RecipeId, 4)),
                MealEntry(date, "Dinner", PlannedRecipe(first.RecipeId, 2)),
            },
        });

        Assert.Equal(second.RecipeId, Assert.Single(Assert.Single(result.Entries, entry => entry.Slot.ToString() == "Lunch").Recipes).RecipeId);
        Assert.Equal(first.RecipeId, Assert.Single(Assert.Single(result.Entries, entry => entry.Slot.ToString() == "Dinner").Recipes).RecipeId);
    }

    [Fact]
    public async Task Clear_range_removes_everything_in_it_except_what_the_request_writes()
    {
        var (first, second) = await TwoRecipes("MB clear");
        var monday = new DateOnly(2032, 6, 7);
        await Create(monday, "Dinner", first.RecipeId);
        await Create(monday.AddDays(3), "Lunch", first.RecipeId);
        var outside = await Create(monday.AddDays(7), "Dinner", first.RecipeId);

        var result = await Batch(new
        {
            clearRange = new { from = monday, to = monday.AddDays(6) },
            upsert = new[] { MealEntry(monday.AddDays(3), "Lunch", PlannedRecipe(second.RecipeId, 1)) },
        });

        Assert.Equal(monday, result.From);
        Assert.Equal(monday.AddDays(6), result.To);
        var kept = Assert.Single(result.Entries);
        Assert.Equal(second.RecipeId, Assert.Single(kept.Recipes).RecipeId);
        Assert.Contains(await Range(monday.AddDays(7), monday.AddDays(7)), entry => entry.MealPlanEntryId == outside.MealPlanEntryId);
    }

    [Fact]
    public async Task Clear_range_alone_clears_a_week()
    {
        var (first, _) = await TwoRecipes("MB clear only");
        var monday = new DateOnly(2032, 7, 5);
        await Create(monday, "Dinner", first.RecipeId);
        await Create(monday.AddDays(6), "Dinner", first.RecipeId);

        var result = await Batch(new { clearRange = new { from = monday, to = monday.AddDays(6) } });

        Assert.Empty(result.Entries);
        Assert.Empty(await Range(monday, monday.AddDays(6)));
    }

    [Fact]
    public async Task Validation_errors_name_the_problem()
    {
        var (first, _) = await TwoRecipes("MB errors");
        var date = new DateOnly(2032, 8, 2);

        Assert.Contains("Nothing to do", await BatchError(new { }));
        Assert.Contains("clearRange.from", await BatchError(new { clearRange = new { from = date, to = date.AddDays(-1) } }));
        Assert.Contains("at most 62 days", await BatchError(new { clearRange = new { from = date, to = date.AddDays(62) } }));
        Assert.Contains("more than once", await BatchError(new
        {
            upsert = new[]
            {
                MealEntry(date, "Dinner", PlannedRecipe(first.RecipeId, 1)),
                MealEntry(date, "Dinner", PlannedRecipe(first.RecipeId, 2)),
            },
        }));
        Assert.Contains("No recipes found for IDs: 999999", await BatchError(new { upsert = new[] { MealEntry(date, "Dinner", PlannedRecipe(999_999, 1)) } }));
        Assert.Contains("positive portion count", await BatchError(new { upsert = new[] { MealEntry(date, "Dinner", PlannedRecipe(first.RecipeId, 0)) } }));
        Assert.Contains("No meal plan entries found for IDs: 987654", await BatchError(new { delete = new[] { 987_654 } }));
    }

    [Fact]
    public async Task A_batch_with_one_bad_part_changes_nothing()
    {
        var (first, second) = await TwoRecipes("MB atomic");
        var monday = new DateOnly(2032, 9, 6);
        var existing = await Create(monday, "Dinner", first.RecipeId);

        await BatchError(new
        {
            clearRange = new { from = monday, to = monday.AddDays(6) },
            upsert = new[]
            {
                MealEntry(monday.AddDays(1), "Dinner", PlannedRecipe(second.RecipeId, 2)),
                MealEntry(monday.AddDays(2), "Dinner", PlannedRecipe(999_999, 2)),
            },
        });
        await BatchError(new
        {
            upsert = new[] { MealEntry(monday.AddDays(1), "Dinner", PlannedRecipe(second.RecipeId, 2)) },
            delete = new[] { existing.MealPlanEntryId, 987_653 },
        });

        var week = await Range(monday, monday.AddDays(6));
        var only = Assert.Single(week);
        Assert.Equal(existing.MealPlanEntryId, only.MealPlanEntryId);
        Assert.Equal(first.RecipeId, Assert.Single(only.Recipes).RecipeId);
    }
}
