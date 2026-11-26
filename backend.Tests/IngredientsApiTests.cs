using System.Net;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

public class IngredientsApiTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task An_update_returns_the_updated_ingredient()
    {
        var created = await CreateIngredient(client, "IT carrot", "Vegetable");

        var update = await client.PutJson($"/api/ingredients/{created.IngredientId}", new
        {
            ingredientName = "IT carrots",
            description = "Orange.",
            brandId = (int?)null,
            imageUrl = (string?)null,
            tags = new[] { "Vegetable", "RootVegetable" },
            nutritionPer100 = (object?)null,
            color = "#ff8800",
        });

        await update.EnsureStatus(HttpStatusCode.OK);
        var returned = await update.Read<IngredientDto>();
        Assert.Equal(created.IngredientId, returned.IngredientId);
        Assert.Equal("IT carrots", returned.IngredientName);
        Assert.Equal("Orange.", returned.Description);
        Assert.Equal(["RootVegetable", "Vegetable"], returned.Tags);
        Assert.Equal("#ff8800", returned.Color);

        var reloaded = await client.GetJson<IngredientDto>($"/api/ingredients/{created.IngredientId}");
        Assert.Equal(returned, reloaded with { Tags = returned.Tags });
        Assert.Equal(returned.Tags, reloaded.Tags);
    }

    [Fact]
    public async Task Updating_a_missing_ingredient_is_not_found()
    {
        var update = await client.PutJson("/api/ingredients/999999", new
        {
            ingredientName = "IT ghost",
            tags = Array.Empty<string>(),
        });

        await update.EnsureStatus(HttpStatusCode.NotFound);
    }
}
