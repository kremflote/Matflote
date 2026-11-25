using System.Net;
using DinnerPlanner.Api.Dtos;
using Microsoft.Data.Sqlite;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT B4: a recipe name, and an ingredient name with its brand, identify one row.</summary>
public class DuplicateNameTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private async Task<BrandDto> CreateBrand(string name)
    {
        var response = await client.PostJson("/api/brands", new { name });
        Assert.True(response.IsSuccessStatusCode);
        return await response.Read<BrandDto>();
    }

    private static object IngredientRequest(string name, int? brandId = null) => new
    {
        ingredientName = name,
        brandId,
        tags = Array.Empty<string>(),
    };

    [Fact]
    public async Task Creating_a_recipe_with_an_existing_name_is_a_conflict_ignoring_case_and_spacing()
    {
        var rice = await CreateIngredient(client, "DN rice", "Grain");
        await CreateRecipe(client, Recipe("DN Ærtesuppe", 2, [Line(rice.IngredientId, 100)]));

        foreach (var name in new[] { "DN Ærtesuppe", "dn ærtesuppe", "  DN   ÆRTESUPPE " })
        {
            var response = await client.PostJson("/api/recipes", Recipe(name, 2, [Line(rice.IngredientId, 100)]));
            await response.EnsureStatus(HttpStatusCode.Conflict);
            Assert.Contains("already exists", (await response.ReadJson()).GetProperty("error").GetString());
        }

        var all = await client.GetJson<List<RecipeDto>>("/api/recipes");
        Assert.Single(all, recipe => recipe.Name.Contains("Ærtesuppe"));
    }

    [Fact]
    public async Task Renaming_a_recipe_to_another_recipes_name_is_a_conflict()
    {
        var rice = await CreateIngredient(client, "DN rice 2", "Grain");
        await CreateRecipe(client, Recipe("DN Fiskeboller", 2, [Line(rice.IngredientId, 100)]));
        var other = await CreateRecipe(client, Recipe("DN Kjøttkaker", 2, [Line(rice.IngredientId, 100)]));

        var rename = await client.PutJson($"/api/recipes/{other.RecipeId}", Recipe("dn fiskeboller", 2, [Line(rice.IngredientId, 100)]));

        await rename.EnsureStatus(HttpStatusCode.Conflict);
        Assert.Equal("DN Kjøttkaker", (await client.GetJson<RecipeDto>($"/api/recipes/{other.RecipeId}")).Name);

        // Changing only the case of its own name is not a clash.
        var recase = await client.PutJson($"/api/recipes/{other.RecipeId}", Recipe("DN kjøttkaker", 2, [Line(rice.IngredientId, 100)]));
        await recase.EnsureStatus(HttpStatusCode.OK);
    }

    [Fact]
    public async Task An_ingredient_name_clashes_only_with_the_same_brand()
    {
        var brand = await CreateBrand("DN Tine");
        await (await client.PostJson("/api/ingredients", IngredientRequest("DN Smør"))).EnsureStatus(HttpStatusCode.Created);

        await (await client.PostJson("/api/ingredients", IngredientRequest("dn smør"))).EnsureStatus(HttpStatusCode.Conflict);
        // The same name from a brand is another product.
        await (await client.PostJson("/api/ingredients", IngredientRequest("DN Smør", brand.BrandId))).EnsureStatus(HttpStatusCode.Created);
        await (await client.PostJson("/api/ingredients", IngredientRequest("DN SMØR", brand.BrandId))).EnsureStatus(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Renaming_an_ingredient_or_changing_its_brand_onto_another_is_a_conflict()
    {
        var brand = await CreateBrand("DN Q");
        var plain = await (await client.PostJson("/api/ingredients", IngredientRequest("DN Melk"))).Read<IngredientDto>();
        var branded = await (await client.PostJson("/api/ingredients", IngredientRequest("DN Melk", brand.BrandId))).Read<IngredientDto>();
        var other = await (await client.PostJson("/api/ingredients", IngredientRequest("DN Fløte"))).Read<IngredientDto>();

        await (await client.PutJson($"/api/ingredients/{other.IngredientId}", IngredientRequest("dn melk")))
            .EnsureStatus(HttpStatusCode.Conflict);
        await (await client.PutJson($"/api/ingredients/{branded.IngredientId}", IngredientRequest("DN Melk")))
            .EnsureStatus(HttpStatusCode.Conflict);
        await (await client.PutJson($"/api/ingredients/{plain.IngredientId}", IngredientRequest("DN melk")))
            .EnsureStatus(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_recipe_that_already_shares_its_name_can_still_be_saved_without_renaming()
    {
        var rice = await CreateIngredient(client, "DN rice 3", "Grain");
        var first = await CreateRecipe(client, Recipe("DN Taco", 2, [Line(rice.IngredientId, 100)]));
        var second = await CreateRecipe(client, Recipe("DN Taco fredag", 2, [Line(rice.IngredientId, 100)]));
        // A duplicate from before the check existed, written straight to the database.
        await using (var connection = new SqliteConnection(factory.ConnectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "UPDATE Recipes SET Name = 'DN taco' WHERE RecipeId = $id";
            command.Parameters.AddWithValue("$id", second.RecipeId);
            await command.ExecuteNonQueryAsync();
        }

        var save = await client.PutJson($"/api/recipes/{second.RecipeId}", Recipe("DN taco", 4, [Line(rice.IngredientId, 200)]));

        await save.EnsureStatus(HttpStatusCode.OK);
        Assert.Equal(4m, (await save.Read<RecipeDto>()).Portions);
        Assert.Equal("DN Taco", (await client.GetJson<RecipeDto>($"/api/recipes/{first.RecipeId}")).Name);
    }
}
