using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using DinnerPlanner.Api.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class GroceryListApiTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Totals_scale_by_planned_portions_and_include_components()
    {
        var chicken = await CreateIngredient(client, "GL chicken", "Chicken");
        var rice = await CreateIngredient(client, "GL rice", "Grain");
        var yogurt = await CreateIngredient(client, "GL yogurt", "Dairy");
        var garlic = await CreateIngredient(client, "GL garlic", "Vegetable");

        // The sauce makes 200 g in total (180 g yogurt + 20 g garlic).
        var sauce = await CreateRecipe(client, Recipe("GL sauce", 2, [Line(yogurt.IngredientId, 180), Line(garlic.IngredientId, 20)]));
        // The bowl serves 4 and uses 100 g of the sauce, i.e. half of it.
        var bowl = await CreateRecipe(client, Recipe(
            "GL bowl",
            4,
            [Line(chicken.IngredientId, 400), Line(rice.IngredientId, 300), Line(garlic.IngredientId, 10)],
            [Component(sauce.RecipeId, 100)]));

        var monday = new DateOnly(2031, 1, 6);
        // 6 portions of a 4-portion recipe: factor 1.5.
        await (await client.PostJson("/api/mealplans", MealEntry(monday, "Dinner", PlannedRecipe(bowl.RecipeId, 6))))
            .EnsureStatus(HttpStatusCode.Created);
        // 2 portions on Tuesday: factor 0.5.
        await (await client.PostJson("/api/mealplans", MealEntry(monday.AddDays(1), "Dinner", PlannedRecipe(bowl.RecipeId, 2))))
            .EnsureStatus(HttpStatusCode.Created);
        // Outside the range: must not be counted.
        await (await client.PostJson("/api/mealplans", MealEntry(monday.AddDays(7), "Dinner", PlannedRecipe(bowl.RecipeId, 4))))
            .EnsureStatus(HttpStatusCode.Created);

        var list = await client.GetJson<GroceryListDto>(
            $"/api/grocerylists/preview?from={monday:yyyy-MM-dd}&to={monday.AddDays(6):yyyy-MM-dd}");

        var items = list.Sections.SelectMany(section => section.Items).ToDictionary(item => item.IngredientName);
        // Total factor across the two days is 2.0.
        Assert.Equal(800m, items["GL chicken"].Amount);
        Assert.Equal(600m, items["GL rice"].Amount);
        // Component: 100 g of a 200 g sauce = 0.5 per bowl batch, times 2.0 → 180 g yogurt.
        Assert.Equal(180m, items["GL yogurt"].Amount);
        // Garlic from both the bowl (10 × 2) and the sauce (20 × 0.5 × 2) is added together.
        Assert.Equal(40m, items["GL garlic"].Amount);
        Assert.Equal("40 g", items["GL garlic"].DisplayAmount);
        Assert.Contains("GL sauce via GL bowl", items["GL yogurt"].SourceRecipes);

        Assert.Equal("Protein", list.Sections.Single(section => section.Items.Any(item => item.IngredientName == "GL chicken")).Name);
        Assert.Equal("Produce", list.Sections.Single(section => section.Items.Any(item => item.IngredientName == "GL garlic")).Name);
    }

    [Fact]
    public async Task An_empty_range_gives_an_empty_list()
    {
        var list = await client.GetJson<GroceryListDto>("/api/grocerylists/preview?from=2032-01-05&to=2032-01-11");
        Assert.Empty(list.Sections);
    }

    [Fact]
    public async Task An_empty_week_reads_no_recipes_and_a_planned_one_reads_only_what_it_uses()
    {
        var flour = await CreateIngredient(client, "GL2 flour", "Grain");
        var salt = await CreateIngredient(client, "GL2 salt", "Spice");
        var yeast = await CreateIngredient(client, "GL2 yeast", "Grain");
        // Two levels of components: pizza -> dough -> starter.
        var starter = await CreateRecipe(client, Recipe("GL2 starter", 1, [Line(yeast.IngredientId, 10), Line(flour.IngredientId, 90)]));
        var dough = await CreateRecipe(client, Recipe("GL2 dough", 1, [Line(flour.IngredientId, 400)], [Component(starter.RecipeId, 50)]));
        var pizza = await CreateRecipe(client, Recipe("GL2 pizza", 2, [Line(salt.IngredientId, 5)], [Component(dough.RecipeId, 225)]));
        await CreateRecipe(client, Recipe("GL2 unrelated", 2, [Line(salt.IngredientId, 1)]));
        var monday = new DateOnly(2033, 3, 7);
        await (await client.PostJson("/api/mealplans", MealEntry(monday, "Dinner", PlannedRecipe(pizza.RecipeId, 2))))
            .EnsureStatus(HttpStatusCode.Created);

        using var recorder = new SqlRecorder(factory.DatabasePath);
        await client.GetJson<GroceryListDto>($"/api/grocerylists/preview?from={monday.AddDays(7):yyyy-MM-dd}&to={monday.AddDays(13):yyyy-MM-dd}");
        Assert.Contains(recorder.Commands, sql => sql.Contains("FROM \"MealPlanEntries\"", StringComparison.Ordinal));
        Assert.DoesNotContain(recorder.Commands, sql => sql.Contains("FROM \"Recipes\"", StringComparison.Ordinal));

        var list = await client.GetJson<GroceryListDto>($"/api/grocerylists/preview?from={monday:yyyy-MM-dd}&to={monday.AddDays(6):yyyy-MM-dd}");
        var items = list.Sections.SelectMany(section => section.Items).ToDictionary(item => item.IngredientName);
        // A component scales by its amount over the child's own ingredient total: dough 225/400, starter 50/100.
        // Flour: 400 x 0.5625 + 90 x 0.5625 x 0.5 = 250.3125; yeast: 10 x 0.5625 x 0.5 = 2.8125.
        Assert.Equal(250.3125m, items["GL2 flour"].Amount);
        Assert.Equal(2.8125m, items["GL2 yeast"].Amount);
        Assert.Equal(5m, items["GL2 salt"].Amount);
    }

    /// <summary>Collects the SQL that EF Core runs against one database file while it is alive.</summary>
    private sealed class SqlRecorder : IObserver<DiagnosticListener>, IObserver<KeyValuePair<string, object?>>, IDisposable
    {
        private readonly string databasePath;
        private readonly List<IDisposable> subscriptions = [];
        private readonly ConcurrentQueue<string> commands = new();

        public SqlRecorder(string databasePath)
        {
            this.databasePath = databasePath;
            subscriptions.Add(DiagnosticListener.AllListeners.Subscribe(this));
        }

        public IReadOnlyCollection<string> Commands => commands.ToArray();

        public void OnNext(DiagnosticListener listener)
        {
            if (listener.Name == DbLoggerCategory.Name)
            {
                subscriptions.Add(listener.Subscribe(this));
            }
        }

        public void OnNext(KeyValuePair<string, object?> value)
        {
            if (value.Value is CommandExecutedEventData data &&
                data.Command.Connection?.DataSource is { } source &&
                Path.GetFullPath(source) == Path.GetFullPath(databasePath))
            {
                commands.Enqueue(data.Command.CommandText);
            }
        }

        public void OnCompleted()
        {
        }

        public void OnError(Exception error)
        {
        }

        public void Dispose()
        {
            foreach (var subscription in subscriptions)
            {
                subscription.Dispose();
            }
        }
    }
}
