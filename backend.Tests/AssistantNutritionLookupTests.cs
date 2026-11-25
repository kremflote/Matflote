using System.Net;
using System.Text.Json;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace DinnerPlanner.Api.Tests;

/// <summary>The app with Matvaretabellen answered by a small fake food table.</summary>
public class MatvaretabellenFakeFactory : MatfloteFactory
{
    // Two foods, in the shape of https://www.matvaretabellen.no/api/nb/foods.json.
    private const string Foods = """
        {
          "foods": [
            {
              "foodId": "05.123", "foodName": "Laks, oppdrett, rå", "uri": "/laks-oppdrett-ra/",
              "searchKeywords": ["laks"],
              "calories": { "quantity": 199, "unit": "kcal" },
              "constituents": [
                { "nutrientId": "Protein", "quantity": 20.2 }, { "nutrientId": "Fett", "quantity": 13.1 },
                { "nutrientId": "Karbo", "quantity": 0 }, { "nutrientId": "Vit D", "quantity": 8.2 }
              ]
            },
            {
              "foodId": "06.001", "foodName": "Brokkoli, rå", "uri": "/brokkoli-ra/",
              "searchKeywords": ["brokkoli"],
              "calories": { "quantity": 34, "unit": "kcal" },
              "constituents": [{ "nutrientId": "Protein", "quantity": 3.0 }, { "nutrientId": "Fiber", "quantity": 3.1 }]
            }
          ]
        }
        """;

    public bool Unreachable { get; set; }

    public FakeHttpHandler Handler { get; }

    public MatvaretabellenFakeFactory()
    {
        Handler = new FakeHttpHandler(_ => Unreachable
            ? throw new HttpRequestException("No route to host")
            : FakeHttpHandler.Json(Foods));
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
            services.AddHttpClient<MatvaretabellenNutritionLookupService>().ConfigurePrimaryHttpMessageHandler(() => Handler));
    }
}

public class AssistantNutritionLookupTests(MatvaretabellenFakeFactory factory) : IClassFixture<MatvaretabellenFakeFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private Task<JsonElement> Ingredient(JsonElement item) =>
        client.GetJson<JsonElement>($"/api/ingredients/{item.GetProperty("id").GetInt32()}");

    [Fact]
    public async Task New_ingredients_without_nutrition_get_the_best_match_and_report_it()
    {
        var result = await client.Import(new
        {
            lookupNutrition = true,
            ingredients = new object[]
            {
                new { name = "Laks", tags = new[] { "Fish" } },
                // Values sent by the agent win; no lookup for this one.
                new { name = "Brokkoli", tags = new[] { "Vegetable" }, nutritionPer100 = new { calories = 40 } },
            },
            recipes = new[]
            {
                // "Brokkoli rå" is created automatically from the recipe line and looked up too.
                new { name = "NL salmon", portions = 2, tags = new[] { "Dinner", "Fish" }, ingredients = new[] { new { name = "Laks", amount = 400, unit = "g" }, new { name = "Brokkoli rå", amount = 200, unit = "g" } } },
            },
        });

        var salmon = result.Item("ingredients", "Laks");
        var match = salmon.GetProperty("nutritionMatch");
        Assert.Equal("05.123", match.GetProperty("foodId").GetString());
        Assert.Equal("Laks, oppdrett, rå", match.GetProperty("foodName").GetString());
        Assert.True(match.GetProperty("confidence").GetDecimal() >= AssistantService.NutritionMatchThreshold);
        Assert.Equal("https://www.matvaretabellen.no/laks-oppdrett-ra/", match.GetProperty("url").GetString());

        var stored = await Ingredient(salmon);
        Assert.Equal(199, stored.GetProperty("nutritionPer100").GetProperty("calories").GetInt32());
        Assert.Equal(20.2m, stored.GetProperty("nutritionPer100").GetProperty("proteinGrams").GetDecimal());
        Assert.Equal("Matvaretabellen", stored.GetProperty("nutritionSource").GetString());
        Assert.Equal("05.123", stored.GetProperty("matvaretabellenFoodId").GetString());
        Assert.Equal(["Fish"], stored.Strings("tags"));

        var broccoli = result.Item("ingredients", "Brokkoli");
        Assert.False(broccoli.TryGetProperty("nutritionMatch", out _));
        Assert.Equal(40, (await Ingredient(broccoli)).GetProperty("nutritionPer100").GetProperty("calories").GetInt32());

        var automatic = result.Item("ingredients", "Brokkoli rå");
        Assert.Equal("06.001", automatic.GetProperty("nutritionMatch").GetProperty("foodId").GetString());
    }

    [Fact]
    public async Task A_weak_match_is_not_attached_and_gives_a_warning()
    {
        var result = await client.Import(new { lookupNutrition = true, ingredients = new[] { new { name = "Røkt laks spesial", tags = new[] { "Fish" } } } });

        var item = result.Item("ingredients", "Røkt laks spesial");
        Assert.False(item.TryGetProperty("nutritionMatch", out _));
        Assert.Contains("below 0.70", string.Join(" ", item.Strings("warnings")));
        Assert.Equal(JsonValueKind.Null, (await Ingredient(item)).GetProperty("nutritionPer100").ValueKind);
    }

    [Fact]
    public async Task A_dry_run_reports_the_match_and_saves_nothing()
    {
        var result = await client.Import(new { dryRun = true, lookupNutrition = true, ingredients = new[] { new { name = "NL laks", tags = new[] { "Fish" } } } });

        Assert.Equal("would_create", result.Item("ingredients", "NL laks").Status());
        Assert.Equal("05.123", result.Item("ingredients", "NL laks").GetProperty("nutritionMatch").GetProperty("foodId").GetString());
        Assert.Null((await client.Context()).FindIngredient("NL laks"));
    }

    [Fact]
    public async Task Existing_ingredients_are_not_looked_up_and_lookup_is_off_by_default()
    {
        var requestsBefore = factory.Handler.Requests.Count;

        // Off by default: a new ingredient without nutrition is only warned about.
        var result = await client.Import(new { ingredients = new[] { new { name = "NL plain", tags = new[] { "Grain" } } } });
        Assert.Contains("no nutrition data", string.Join(" ", result.Item("ingredients", "NL plain").Strings("warnings")));

        // Existing ingredients, skipped or updated, are never looked up.
        await client.Import(new { lookupNutrition = true, onExistingIngredient = "update", ingredients = new[] { new { name = "NL plain", tags = new[] { "Grain" } } } });

        Assert.Equal(requestsBefore, factory.Handler.Requests.Count);
    }
}

public class AssistantNutritionLookupUnreachableTests(MatvaretabellenFakeFactory factory) : IClassFixture<MatvaretabellenFakeFactory>
{
    [Fact]
    public async Task When_Matvaretabellen_cannot_be_reached_the_import_still_succeeds_with_a_warning()
    {
        factory.Unreachable = true;
        var client = factory.CreateClient();

        var result = await client.Import(new { lookupNutrition = true, ingredients = new[] { new { name = "Laks", tags = new[] { "Fish" } } } });

        var item = result.Item("ingredients", "Laks");
        Assert.Equal("created", item.Status());
        Assert.Contains("could not be reached", string.Join(" ", item.Strings("warnings")));
        Assert.Single(factory.Handler.Requests);
    }
}
