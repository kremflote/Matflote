using System.Net;
using System.Text.Json;

namespace DinnerPlanner.Api.Tests;

/// <summary>
/// The "done when" of WP3 in docs/PLAN.md: an agent that follows docs/agent-guide.md adds three new recipes and plans
/// next week's dinners with two fish days and nothing planned in the last three weeks, in at most five requests, with
/// every new ingredient carrying tags. The agent below makes exactly the requests the guide prescribes, uses only
/// what the guide tells it to read, and every request it makes is counted.
/// </summary>
public class AgentGuideSessionTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private const int WeeksWithoutRepeat = 3;
    private const int FishDays = 2;

    /// <summary>Counts every request that reaches the app.</summary>
    private sealed class CountingHandler : DelegatingHandler
    {
        public List<string> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add($"{request.Method} {request.RequestUri!.PathAndQuery}");
            return base.SendAsync(request, cancellationToken);
        }
    }

    // The recipes the person asked for, as the agent would write them from the guide's rules.
    private static readonly (string Name, string[] Tags, (string Ingredient, decimal Amount, string Unit)[] Lines)[] NewRecipes =
    [
        ("GD torsk med purreløk", ["Dinner", "Fish"], [("GD torsk", 600, "g"), ("GD purreløk", 300, "g"), ("Rice", 300, "g")]),
        ("GD linsesuppe", ["Dinner", "Vegetarian", "Soup"], [("GD røde linser", 250, "g"), ("GD hermetiske tomater", 400, "g")]),
        ("GD kyllingwok", ["Dinner", "Chicken"], [("GD kyllingfilet", 500, "g"), ("Rice", 300, "g"), ("GD soyasaus", 3, "tbsp")]),
    ];

    // Tags the agent picks for the ingredients it has to define (all exist in tagCategories).
    private static readonly Dictionary<string, string[]> NewIngredientTags = new()
    {
        ["GD torsk"] = ["Fish"],
        ["GD purreløk"] = ["Vegetable"],
        ["GD røde linser"] = ["Grain"],
        ["GD hermetiske tomater"] = ["Vegetable"],
        ["GD kyllingfilet"] = ["Chicken"],
        ["GD soyasaus"] = ["Sauce"],
    };

    [Fact]
    public async Task An_agent_following_the_guide_adds_three_recipes_and_plans_next_week_in_five_requests()
    {
        var setup = factory.CreateClient();
        var (nextMonday, cutoff) = await SeedHistory(setup);
        var ingredientsBefore = (await setup.Context()).GetProperty("ingredients").EnumerateArray()
            .Select(ingredient => ingredient.GetProperty("id").GetInt32()).ToHashSet();

        var counter = new CountingHandler();
        var agent = factory.CreateDefaultClient(counter);

        // 1. Read the context.
        var context = await agent.GetJson<JsonElement>("/api/assistant/context");
        var weekStart = DateOnly.Parse(context.GetProperty("weekStart").GetString()!);
        Assert.Equal(nextMonday, weekStart.AddDays(7));
        var peopleEating = context.GetProperty("planningPreferences").GetProperty("peopleEating").GetInt32();
        var known = context.GetProperty("ingredients").EnumerateArray()
            .Select(ingredient => ingredient.GetProperty("name").GetString()!).ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Every ingredient that is not in the context is defined, with tags; createMissingIngredients stays false.
        var recipeBody = new Dictionary<string, object?>
        {
            ["dryRun"] = true,
            ["createMissingIngredients"] = false,
            ["lookupNutrition"] = false,
            ["ingredients"] = NewRecipes.SelectMany(recipe => recipe.Lines).Select(line => line.Ingredient).Distinct()
                .Where(name => !known.Contains(name))
                .Select(name => new { name, tags = NewIngredientTags[name], nutritionPer100 = new { calories = 100 } })
                .ToList(),
            ["recipes"] = NewRecipes.Select(recipe => new
            {
                name = recipe.Name,
                portions = 4,
                instructions = "Cook it.",
                tags = recipe.Tags,
                ingredients = recipe.Lines.Select(line => new { name = line.Ingredient, amount = line.Amount, unit = line.Unit }).ToList(),
            }).ToList(),
        };

        // 2. Dry run of the recipes.
        var recipeDryRun = await agent.Import(recipeBody);
        Assert.False(recipeDryRun.GetProperty("applied").GetBoolean());
        Assert.All(recipeDryRun.GetProperty("recipes").EnumerateArray(), item => Assert.Equal("would_create", item.Status()));

        // 3. Save them.
        recipeBody["dryRun"] = false;
        var saved = await agent.Import(recipeBody);
        Assert.True(saved.GetProperty("applied").GetBoolean());

        // Choose the dinners from what the context said (the new recipes were never planned).
        bool RecentlyPlanned(JsonElement recipe) =>
            (recipe.TryGetProperty("lastPlanned", out var last) && DateOnly.Parse(last.GetString()!) >= cutoff)
            || (recipe.TryGetProperty("nextPlanned", out var next) && DateOnly.Parse(next.GetString()!) < nextMonday);
        var candidates = context.GetProperty("recipes").EnumerateArray()
            .Where(recipe => recipe.Strings("tags").Contains("Dinner") && !RecentlyPlanned(recipe))
            .Select(recipe => (Name: recipe.GetProperty("name").GetString()!, Fish: recipe.Strings("tags").Contains("Fish")))
            .Concat(NewRecipes.Select(recipe => (recipe.Name, Fish: recipe.Tags.Contains("Fish"))))
            .ToList();
        var dinners = candidates.Where(recipe => recipe.Fish).Take(FishDays)
            .Concat(candidates.Where(recipe => !recipe.Fish).Take(7 - FishDays))
            .Select(recipe => recipe.Name)
            .ToList();
        Assert.Equal(7, dinners.Count);

        var planBody = new Dictionary<string, object?>
        {
            ["dryRun"] = true,
            ["mode"] = "replace",
            ["clearRange"] = new { from = nextMonday, to = nextMonday.AddDays(6) },
            ["entries"] = dinners.Select((recipe, day) => new
            {
                date = nextMonday.AddDays(day),
                slot = "Dinner",
                items = new[] { new { recipe, portions = peopleEating } },
            }).ToList(),
        };

        // 4. Dry run of the week. The guide says: any would_replace or would_clear means ask the person first.
        var planDryRun = await agent.PlanMeals(planBody);
        Assert.All(planDryRun.GetProperty("entries").EnumerateArray(), row => Assert.Equal("would_create", row.Status()));

        // 5. Save the week.
        planBody["dryRun"] = false;
        var planned = await agent.PlanMeals(planBody);
        Assert.True(planned.GetProperty("applied").GetBoolean());

        Assert.Equal(
            [
                "GET /api/assistant/context",
                "POST /api/assistant/recipes",
                "POST /api/assistant/recipes",
                "PUT /api/assistant/meal-plan",
                "PUT /api/assistant/meal-plan",
            ],
            counter.Requests);

        // Checked afterwards, outside the agent's session.
        var after = await setup.Context();
        var tagsByRecipe = after.GetProperty("recipes").EnumerateArray()
            .ToDictionary(recipe => recipe.GetProperty("name").GetString()!, recipe => recipe.Strings("tags"));
        foreach (var recipe in NewRecipes)
        {
            Assert.True(tagsByRecipe.ContainsKey(recipe.Name), $"{recipe.Name} was not created.");
        }

        var newIngredients = after.GetProperty("ingredients").EnumerateArray()
            .Where(ingredient => !ingredientsBefore.Contains(ingredient.GetProperty("id").GetInt32()))
            .ToList();
        Assert.Equal(NewIngredientTags.Count, newIngredients.Count);
        Assert.All(newIngredients, ingredient => Assert.NotEmpty(ingredient.Strings("tags")));

        var week = (await setup.MealPlan(nextMonday, nextMonday.AddDays(6))).GetProperty("entries").EnumerateArray().ToList();
        Assert.Equal(7, week.Count);
        Assert.All(week, entry => Assert.Equal("Dinner", entry.GetProperty("slot").GetString()));
        var plannedNames = week.Select(entry => entry.GetProperty("items")[0].GetProperty("recipe").GetString()!).ToList();
        Assert.Equal(7, plannedNames.Distinct().Count());
        Assert.Equal(FishDays, plannedNames.Count(name => tagsByRecipe[name].Contains("Fish")));
        Assert.All(week, entry => Assert.Equal(peopleEating, entry.GetProperty("items")[0].GetProperty("portions").GetDecimal()));

        // Nothing in the week was planned in the three weeks before it.
        var before = (await setup.MealPlan(cutoff, nextMonday.AddDays(-1))).GetProperty("entries").EnumerateArray()
            .SelectMany(entry => entry.GetProperty("items").EnumerateArray())
            .Where(item => item.TryGetProperty("recipe", out _))
            .Select(item => item.GetProperty("recipe").GetString()!)
            .ToHashSet();
        Assert.DoesNotContain(plannedNames, before.Contains);
    }

    [Fact]
    public async Task The_meal_plan_dry_run_shows_the_agent_a_week_that_already_has_meals()
    {
        var setup = factory.CreateClient();
        var weekStart = DateOnly.Parse((await setup.Context()).GetProperty("weekStart").GetString()!);
        // Two weeks ahead, so this test does not touch the week the other test plans.
        var monday = weekStart.AddDays(14);
        await setup.Import(new { recipes = new[] { new { name = "GD planned already", portions = 2, tags = new[] { "Dinner" }, ingredients = Array.Empty<object>() } } });
        await setup.PlanMeals(new { entries = new[] { new { date = monday.AddDays(2), slot = "Dinner", items = new[] { new { recipe = "GD planned already" } } } } });

        var dryRun = await setup.PlanMeals(new
        {
            dryRun = true,
            clearRange = new { from = monday, to = monday.AddDays(6) },
            entries = new[] { new { date = monday, slot = "Dinner", items = new[] { new { recipe = "GD planned already" } } } },
        });

        // The guide's rule 2: this row means "ask the person before saving".
        var statuses = dryRun.GetProperty("entries").EnumerateArray().Select(row => row.Status()).ToArray();
        Assert.Equal(["would_create", "would_clear"], statuses);
        Assert.Single((await setup.MealPlan(monday, monday.AddDays(6))).GetProperty("entries").EnumerateArray());
    }

    /// <summary>
    /// Recipes planned at known distances from next Monday. Returns next Monday and the first day of the three weeks
    /// before it.
    /// </summary>
    private static async Task<(DateOnly NextMonday, DateOnly Cutoff)> SeedHistory(HttpClient client)
    {
        var weekStart = DateOnly.Parse((await client.Context()).GetProperty("weekStart").GetString()!);
        var nextMonday = weekStart.AddDays(7);
        var cutoff = nextMonday.AddDays(-7 * WeeksWithoutRepeat);

        object Dinner(string name, params string[] tags) =>
            new { name, portions = 4, tags = tags.Prepend("Dinner").ToArray(), ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } };

        await client.Import(new
        {
            recipes = new[]
            {
                Dinner("GD cod", "Fish"),
                Dinner("GD salmon", "Fish"),
                Dinner("GD trout", "Fish"),
                Dinner("GD chicken curry", "Chicken"),
                Dinner("GD tacos", "Mince"),
                Dinner("GD lasagne", "Beef"),
                Dinner("GD stew"),
            },
        });

        object Meal(DateOnly date, string recipe) => new { date, slot = "Dinner", items = new[] { new { recipe } } };
        await client.PlanMeals(new
        {
            entries = new[]
            {
                Meal(cutoff.AddDays(4), "GD cod"),          // inside the three weeks
                Meal(cutoff.AddDays(-9), "GD salmon"),      // before them
                Meal(weekStart.AddDays(6), "GD trout"),     // later this week
                Meal(cutoff.AddDays(-1), "GD chicken curry"), // the day before the three weeks
                Meal(cutoff, "GD tacos"),                   // their first day
                Meal(cutoff.AddDays(-30), "GD stew"),
            },
        });

        return (nextMonday, cutoff);
    }
}
