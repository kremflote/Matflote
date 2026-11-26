using System.Net;
using System.Text.Json;
using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Tests;

public class AssistantImportTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    private static object SimpleRecipe(string name, decimal portions = 2, string ingredient = "Rice", decimal amount = 100) => new
    {
        name,
        portions,
        tags = new[] { "Dinner" },
        ingredients = new[] { new { name = ingredient, amount, unit = "g" } },
    };

    private Task<JsonElement> Document(int id) => client.GetJson<JsonElement>($"/api/assistant/recipes/{id}");

    private static int Id(JsonElement item) => item.GetProperty("id").GetInt32();

    // ---------- create ----------

    [Fact]
    public async Task Create_defines_ingredients_creates_missing_ones_and_converts_units()
    {
        var result = await client.Import(new
        {
            ingredients = new[]
            {
                new
                {
                    name = "IM red lentils",
                    tags = new[] { "Grain" },
                    description = "Split lentils.",
                    color = "#d9693a",
                    nutritionPer100 = new { calories = 340, proteinGrams = 24 },
                },
            },
            recipes = new object[]
            {
                new
                {
                    name = "IM lentil soup",
                    description = "Quick soup.",
                    instructions = "Simmer.",
                    portions = 4,
                    tags = new[] { "dinner" },
                    ingredients = new object[]
                    {
                        new { name = "IM red lentils", amount = 250, unit = "g" },
                        new { name = "IM brand new spice", amount = 1, unit = "tbsp", preparation = "Chopped" },
                        new { name = "IM water", amount = 1, unit = "l" },
                        new { name = "IM salt to taste" },
                    },
                    components = new[] { new { recipe = "IM lentil topping", amount = 50, unit = "g" } },
                },
                new
                {
                    name = "IM lentil topping",
                    portions = 1,
                    tags = Array.Empty<string>(),
                    ingredients = new[] { new { name = "IM red lentils", amount = 50, unit = "g" } },
                },
            },
        });

        Assert.True(result.GetProperty("applied").GetBoolean());
        Assert.False(result.GetProperty("dryRun").GetBoolean());
        Assert.Empty(result.GetProperty("errors").EnumerateArray());

        var lentils = result.Item("ingredients", "IM red lentils");
        Assert.Equal("created", lentils.Status());
        var soup = result.Item("recipes", "IM lentil soup");
        Assert.Equal("created", soup.Status());
        Assert.Equal("created", result.Item("recipes", "IM lentil topping").Status());
        // The automatically created ingredients are reported as created, with a warning.
        var automaticResult = result.Item("ingredients", "IM brand new spice");
        Assert.Equal("created", automaticResult.Status());
        Assert.Contains(automaticResult.Strings("warnings"), warning => warning.Contains("with no tags"));
        Assert.Contains(automaticResult.Strings("warnings"), warning => warning.Contains("no nutrition data"));

        var document = await Document(Id(soup));
        Assert.Equal("IM lentil soup", document.GetProperty("name").GetString());
        Assert.Equal(4m, document.GetProperty("portions").GetDecimal());
        Assert.Equal(["Dinner"], document.Strings("tags"));
        var lines = document.GetProperty("ingredients").EnumerateArray()
            .ToDictionary(line => line.GetProperty("name").GetString()!);
        Assert.Equal(250m, lines["IM red lentils"].GetProperty("amount").GetDecimal());
        Assert.Equal(15m, lines["IM brand new spice"].GetProperty("amount").GetDecimal());
        Assert.Equal("ml", lines["IM brand new spice"].GetProperty("unit").GetString());
        Assert.Equal("Chopped", lines["IM brand new spice"].GetProperty("preparation").GetString());
        Assert.Equal(1m, lines["IM water"].GetProperty("amount").GetDecimal());
        Assert.Equal("l", lines["IM water"].GetProperty("unit").GetString());
        Assert.Equal(JsonValueKind.Null, lines["IM salt to taste"].GetProperty("amount").ValueKind);
        var component = Assert.Single(document.GetProperty("components").EnumerateArray());
        Assert.Equal("IM lentil topping", component.GetProperty("recipe").GetString());
        Assert.Equal(50m, component.GetProperty("amount").GetDecimal());

        var context = await client.Context();
        var defined = context.FindIngredient("IM red lentils")!.Value;
        Assert.True(defined.GetProperty("hasNutrition").GetBoolean());
        Assert.Equal(["Grain"], defined.Strings("tags"));
        var automatic = context.FindIngredient("IM brand new spice")!.Value;
        Assert.False(automatic.GetProperty("hasNutrition").GetBoolean());
        Assert.Empty(automatic.Strings("tags"));

        // The regular API sees the same recipe.
        var regular = await client.GetJson<RecipeDto>($"/api/recipes/{Id(soup)}");
        Assert.Equal("IM lentil topping", Assert.Single(regular.Components).Name);
    }

    [Fact]
    public async Task Repeated_lines_for_one_ingredient_are_added_together()
    {
        var result = await client.Import(new
        {
            recipes = new[]
            {
                new
                {
                    name = "IM double rice",
                    portions = 2,
                    tags = Array.Empty<string>(),
                    ingredients = new[]
                    {
                        new { name = "Rice", amount = 100, unit = "g" },
                        new { name = "Rice", amount = 1, unit = "kg" },
                    },
                },
            },
        });

        var recipe = result.Item("recipes", "IM double rice");
        Assert.Contains(recipe.Strings("warnings"), warning => warning.Contains("listed more than once"));
        var line = Assert.Single((await Document(Id(recipe))).GetProperty("ingredients").EnumerateArray());
        var grams = line.GetProperty("unit").GetString() == "kg"
            ? line.GetProperty("amount").GetDecimal() * 1000
            : line.GetProperty("amount").GetDecimal();
        Assert.Equal(1100m, grams);
    }

    // ---------- skip, update, dry run ----------

    [Fact]
    public async Task An_existing_recipe_is_skipped_by_default()
    {
        var first = await client.Import(new { recipes = new[] { SimpleRecipe("IM skip me", portions: 2) } });
        var id = Id(first.Item("recipes", "IM skip me"));

        var second = await client.Import(new { recipes = new[] { SimpleRecipe("IM skip me", portions: 6, amount: 999) } });

        Assert.True(second.GetProperty("applied").GetBoolean());
        var item = second.Item("recipes", "IM skip me");
        Assert.Equal("skipped", item.Status());
        Assert.Equal(id, Id(item));
        Assert.Contains(item.Strings("warnings"), warning => warning.Contains("onExistingRecipe"));

        var document = await Document(id);
        Assert.Equal(2m, document.GetProperty("portions").GetDecimal());
    }

    [Fact]
    public async Task Update_replaces_an_existing_recipe_but_keeps_its_image()
    {
        var first = await client.Import(new { recipes = new[] { SimpleRecipe("IM update me", portions: 2) } });
        var id = Id(first.Item("recipes", "IM update me"));

        // Give it an image through the regular API, the way the web app does.
        var regular = await client.GetJson<RecipeDto>($"/api/recipes/{id}");
        var put = await client.PutJson($"/api/recipes/{id}", new
        {
            name = regular.Name,
            imageUrl = "/images/recipes/test.jpg",
            description = regular.Description,
            instructions = regular.Instructions,
            portions = regular.Portions,
            ingredients = regular.Ingredients.Select(line => TestData.Line(line.Ingredient.IngredientId, line.Amount)).ToArray(),
            tags = regular.Tags,
            components = Array.Empty<object>(),
        });
        await put.EnsureStatus(HttpStatusCode.OK);

        var document = await Document(id);
        var update = await client.Import(new
        {
            onExistingRecipe = "update",
            recipes = new[]
            {
                new
                {
                    name = "IM update me",
                    description = "Now with garlic.",
                    portions = 3,
                    tags = new[] { "Lunch" },
                    ingredients = new[]
                    {
                        new { name = "Rice", amount = 150, unit = "g" },
                        new { name = "Garlic", amount = 10, unit = "g" },
                    },
                },
            },
        });

        var item = update.Item("recipes", "IM update me");
        Assert.Equal("updated", item.Status());
        Assert.Equal(id, Id(item));

        var after = await client.GetJson<RecipeDto>($"/api/recipes/{id}");
        Assert.Equal(3m, after.Portions);
        Assert.Equal("Now with garlic.", after.Description);
        Assert.Equal(["Lunch"], after.Tags);
        Assert.Equal(2, after.Ingredients.Count);
        Assert.Equal("/images/recipes/test.jpg", after.ImageUrl);
        Assert.NotEqual(document.GetProperty("portions").GetDecimal(), after.Portions);
    }

    [Fact]
    public async Task A_recipe_document_can_be_posted_back_unchanged()
    {
        var first = await client.Import(new { recipes = new[] { SimpleRecipe("IM round trip") } });
        var id = Id(first.Item("recipes", "IM round trip"));
        var document = await Document(id);

        var again = await client.Import(new { onExistingRecipe = "update", recipes = new[] { document } });

        Assert.Equal("updated", again.Item("recipes", "IM round trip").Status());
        Assert.Equal(document.GetRawText(), (await Document(id)).GetRawText());
    }

    [Fact]
    public async Task A_recipe_is_renamed_by_id()
    {
        var first = await client.Import(new { recipes = new[] { SimpleRecipe("IM old name") } });
        var id = Id(first.Item("recipes", "IM old name"));

        var rename = await client.Import(new
        {
            onExistingRecipe = "update",
            recipes = new[] { new { id, name = "IM new name", portions = 2, tags = Array.Empty<string>(), ingredients = new[] { new { name = "Rice", amount = 100, unit = "g" } } } },
        });

        Assert.Equal("updated", rename.Item("recipes", "IM new name").Status());
        Assert.Equal("IM new name", (await Document(id)).GetProperty("name").GetString());
    }

    [Fact]
    public async Task Update_of_an_ingredient_only_changes_the_fields_sent()
    {
        await client.Import(new { ingredients = new[] { new { name = "IM tagged oil", tags = new[] { "Sauce" } } } });

        var update = await client.Import(new
        {
            onExistingIngredient = "update",
            ingredients = new[] { new { name = "IM tagged oil", nutritionPer100 = new { calories = 884, fatGrams = 100 } } },
        });

        Assert.Equal("updated", update.Item("ingredients", "IM tagged oil").Status());
        var context = await client.Context();
        var oil = context.FindIngredient("IM tagged oil")!.Value;
        Assert.True(oil.GetProperty("hasNutrition").GetBoolean());
        Assert.Equal(["Sauce"], oil.Strings("tags"));

        var skip = await client.Import(new { ingredients = new[] { new { name = "IM tagged oil", tags = new[] { "Spice" } } } });
        Assert.Equal("skipped", skip.Item("ingredients", "IM tagged oil").Status());
        Assert.Equal(["Sauce"], (await client.Context()).FindIngredient("IM tagged oil")!.Value.Strings("tags"));
    }

    [Fact]
    public async Task A_dry_run_reports_what_would_happen_and_writes_nothing()
    {
        await client.Import(new { recipes = new[] { SimpleRecipe("IM dry existing") } });

        var result = await client.Import(new
        {
            dryRun = true,
            onExistingRecipe = "update",
            ingredients = new[] { new { name = "IM dry ingredient", tags = new[] { "Spice" } } },
            recipes = new[] { SimpleRecipe("IM dry new", ingredient: "IM dry ingredient"), SimpleRecipe("IM dry existing", portions: 8) },
        });

        Assert.True(result.GetProperty("dryRun").GetBoolean());
        Assert.False(result.GetProperty("applied").GetBoolean());
        Assert.Equal("would_create", result.Item("ingredients", "IM dry ingredient").Status());
        Assert.Equal("would_create", result.Item("recipes", "IM dry new").Status());
        Assert.Equal("would_update", result.Item("recipes", "IM dry existing").Status());

        var context = await client.Context();
        Assert.Null(context.FindIngredient("IM dry ingredient"));
        Assert.Null(context.FindRecipe("IM dry new"));
        Assert.Equal(2m, context.FindRecipe("IM dry existing")!.Value.GetProperty("portions").GetDecimal());
    }

    // ---------- errors ----------

    public static TheoryData<string, object, string> InvalidImports() => new()
    {
        { "empty request", new { recipes = Array.Empty<object>() }, "Nothing to import" },
        { "invalid onExistingRecipe", new { onExistingRecipe = "merge", recipes = new[] { SimpleRecipe("IM err a") } }, "onExistingRecipe \"merge\" is not valid" },
        { "invalid onExistingIngredient", new { onExistingIngredient = "error", recipes = new[] { SimpleRecipe("IM err b") } }, "onExistingIngredient \"error\" is not valid" },
        { "unknown tag", new { recipes = new[] { new { name = "IM err c", portions = 2, tags = new[] { "Dinnner" }, ingredients = new[] { new { name = "Rice", amount = 1, unit = "g" } } } } }, "Unknown tag \"Dinnner\". Did you mean \"Dinner\"" },
        { "piece unit", new { recipes = new[] { new { name = "IM err d", portions = 2, tags = Array.Empty<string>(), ingredients = new[] { new { name = "Rice", amount = 2, unit = "pcs" } } } } }, "unit \"pcs\" is not supported" },
        { "name too long", new { recipes = new[] { SimpleRecipe(new string('x', 31)) } }, "the maximum is 30" },
        { "missing name", new { recipes = new[] { SimpleRecipe("") } }, "name is required" },
        { "missing portions", new { recipes = new[] { new { name = "IM err e", tags = Array.Empty<string>(), ingredients = new[] { new { name = "Rice", amount = 1, unit = "g" } } } } }, "portions is required" },
        { "portions that round to zero", new { recipes = new[] { SimpleRecipe("IM err v", portions: 0.004m) } }, "portions is required" },
        { "description too long", new { recipes = new[] { new { name = "IM err f", description = new string('d', 601), portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>() } } }, "the maximum is 600" },
        { "negative amount", new { recipes = new[] { SimpleRecipe("IM err g", amount: -5) } }, "amount cannot be negative" },
        { "unknown preparation", new { recipes = new[] { new { name = "IM err h", portions = 2, tags = Array.Empty<string>(), ingredients = new[] { new { name = "Rice", amount = 1, unit = "g", preparation = "Juggled" } } } } }, "preparation \"Juggled\" is not valid" },
        { "missing ingredient name", new { recipes = new[] { new { name = "IM err i", portions = 2, tags = Array.Empty<string>(), ingredients = new[] { new { amount = 1, unit = "g" } } } } }, "missing its name" },
        { "weight and volume lines", new { recipes = new[] { new { name = "IM err j", portions = 2, tags = Array.Empty<string>(), ingredients = new[] { new { name = "Rice", amount = 1, unit = "g" }, new { name = "Rice", amount = 1, unit = "ml" } } } } }, "both weight and volume" },
        { "duplicate recipe", new { recipes = new[] { SimpleRecipe("IM err k"), SimpleRecipe("im err K") } }, "appears more than once" },
        { "unknown id", new { onExistingRecipe = "update", recipes = new[] { new { id = 987654, name = "IM err l", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>() } } }, "No recipe has id 987654" },
        { "unknown component", new { recipes = new[] { new { name = "IM err m", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>(), components = new[] { new { recipe = "IM nowhere", amount = 10, unit = "g" } } } } }, "no such recipe" },
        { "component without amount", new { recipes = new[] { SimpleRecipe("IM err n1"), new { name = "IM err n2", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>(), components = new[] { new { recipe = "IM err n1", unit = "g" } } } } }, "amount is required and must be greater than 0" },
        { "self component", new { recipes = new[] { new { name = "IM err o", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>(), components = new[] { new { recipe = "IM err o", amount = 10, unit = "g" } } } } }, "cannot use itself" },
        { "circular components", new { recipes = new[] {
            new { name = "IM err p1", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>(), components = new[] { new { recipe = "IM err p2", amount = 10, unit = "g" } } },
            new { name = "IM err p2", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>(), components = new[] { new { recipe = "IM err p1", amount = 10, unit = "g" } } } } }, "circular reference" },
        { "duplicate ingredient definition", new { ingredients = new[] { new { name = "IM err q" }, new { name = "IM err q" } } }, "listed more than once" },
        { "invalid colour", new { ingredients = new[] { new { name = "IM err r", color = "orange" } } }, "must be a hex colour" },
        { "ingredient name too long", new { ingredients = new[] { new { name = new string('i', 41) } } }, "the maximum is 40" },
        { "negative nutrient", new { ingredients = new[] { new { name = "IM err t", nutritionPer100 = new { calories = 100, fatGrams = -1 } } } }, "fatGrams must be between 0" },
        { "unknown ingredient tag", new { ingredients = new[] { new { name = "IM err s", tags = new[] { "Vegetabel" } } } }, "Unknown tag \"Vegetabel\"" },
    };

    [Theory]
    [MemberData(nameof(InvalidImports))]
    public async Task Invalid_imports_are_rejected_with_422_and_write_nothing(string scenario, object body, string expectedError)
    {
        var before = await client.Context();

        var result = await client.Import(body, HttpStatusCode.UnprocessableEntity);

        Assert.False(result.GetProperty("applied").GetBoolean());
        Assert.True(result.AllErrors().Contains(expectedError, StringComparison.Ordinal), $"{scenario}: expected an error containing '{expectedError}', got:\n{result.AllErrors()}");
        var after = await client.Context();
        Assert.Equal(before.GetProperty("recipes").GetRawText(), after.GetProperty("recipes").GetRawText());
        Assert.Equal(before.GetProperty("ingredients").GetRawText(), after.GetProperty("ingredients").GetRawText());
    }

    [Fact]
    public async Task One_bad_recipe_stops_the_whole_request()
    {
        var result = await client.Import(
            new { recipes = new[] { SimpleRecipe("IM good one", ingredient: "IM fresh ingredient"), SimpleRecipe("IM bad one", amount: -1) } },
            HttpStatusCode.UnprocessableEntity);

        Assert.Equal("would_create", result.Item("recipes", "IM good one").Status());
        Assert.Equal("error", result.Item("recipes", "IM bad one").Status());
        var context = await client.Context();
        Assert.Null(context.FindRecipe("IM good one"));
        Assert.Null(context.FindIngredient("IM fresh ingredient"));
    }

    [Fact]
    public async Task Unknown_ingredients_are_errors_with_suggestions_when_creation_is_off()
    {
        await client.Import(new { ingredients = new[] { new { name = "IM yellow onion" } } });

        var result = await client.Import(
            new { createMissingIngredients = false, recipes = new[] { SimpleRecipe("IM onion dish", ingredient: "IM yelow onion") } },
            HttpStatusCode.UnprocessableEntity);

        var errors = result.AllErrors();
        Assert.Contains("no such ingredient", errors);
        Assert.Contains("\"IM yellow onion\"", errors);
    }

    [Fact]
    public async Task OnExistingRecipe_error_rejects_an_existing_name()
    {
        await client.Import(new { recipes = new[] { SimpleRecipe("IM exists already") } });

        var result = await client.Import(
            new { onExistingRecipe = "error", recipes = new[] { SimpleRecipe("IM exists already") } },
            HttpStatusCode.UnprocessableEntity);

        Assert.Contains("already exists", result.AllErrors());
    }

    [Fact]
    public async Task Renaming_onto_another_recipes_name_is_rejected()
    {
        var first = await client.Import(new { recipes = new[] { SimpleRecipe("IM rename a"), SimpleRecipe("IM rename b") } });
        var id = Id(first.Item("recipes", "IM rename a"));

        var result = await client.Import(
            new { onExistingRecipe = "update", recipes = new[] { new { id, name = "IM rename b", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>() } } },
            HttpStatusCode.UnprocessableEntity);

        Assert.Contains("already has that name", result.AllErrors());
    }

    [Fact]
    public async Task Unknown_json_properties_are_rejected_with_400()
    {
        var response = await client.PostJson("/api/assistant/recipes", new { recipes = new[] { new { name = "IM typo", portions = 2, ingredeints = Array.Empty<object>() } } });
        await response.EnsureStatus(HttpStatusCode.BadRequest);

        var topLevel = await client.PostJson("/api/assistant/recipes", new { dryrun = true, recipez = Array.Empty<object>() });
        await topLevel.EnsureStatus(HttpStatusCode.BadRequest);

        Assert.Null((await client.Context()).FindRecipe("IM typo"));
    }

    [Fact]
    public async Task One_recipe_cannot_be_changed_twice_in_a_request()
    {
        var first = await client.Import(new { recipes = new[] { SimpleRecipe("IM twice") } });
        var id = Id(first.Item("recipes", "IM twice"));

        // Renamed by id, and also listed under its old name.
        var result = await client.Import(
            new { onExistingRecipe = "update", recipes = new object[] { new { id, name = "IM twice renamed", portions = 2, tags = Array.Empty<string>(), ingredients = Array.Empty<object>() }, SimpleRecipe("IM twice") } },
            HttpStatusCode.UnprocessableEntity);

        Assert.Contains("already changes recipe", result.AllErrors());
        Assert.NotNull((await client.Context()).FindRecipe("IM twice"));
    }

    [Fact]
    public async Task A_new_ingredient_without_tags_is_created_with_a_warning()
    {
        var result = await client.Import(new { ingredients = new[] { new { name = "IM untagged", nutritionPer100 = new { calories = 10 } } } });

        var item = result.Item("ingredients", "IM untagged");
        Assert.Equal("created", item.Status());
        Assert.Contains("It has no tags", string.Join(" ", item.Strings("warnings")));
        Assert.DoesNotContain("no nutrition data", string.Join(" ", item.Strings("warnings")));
    }

    [Fact]
    public async Task A_misspelled_nutrient_is_rejected_with_400()
    {
        var response = await client.PostJson("/api/assistant/recipes", new { ingredients = new[] { new { name = "IM nutrient typo", nutritionPer100 = new { calories = 100, protienGrams = 3 } } } });
        await response.EnsureStatus(HttpStatusCode.BadRequest);
        Assert.Null((await client.Context()).FindIngredient("IM nutrient typo"));
    }

    [Fact]
    public async Task Calories_with_decimals_are_rounded()
    {
        var result = await client.Import(new { ingredients = new[] { new { name = "IM decimal calories", tags = new[] { "Grain" }, nutritionPer100 = new { calories = 340.6m, proteinGrams = 24.567m } } } });
        var id = Id(result.Item("ingredients", "IM decimal calories"));

        var ingredient = await client.GetJson<JsonElement>($"/api/ingredients/{id}");
        var nutrition = ingredient.GetProperty("nutritionPer100");
        Assert.Equal(341, nutrition.GetProperty("calories").GetInt32());
        Assert.Equal(24.57m, nutrition.GetProperty("proteinGrams").GetDecimal());
        Assert.True((await client.Context()).FindIngredient("IM decimal calories")!.Value.GetProperty("hasNutrition").GetBoolean());
    }

    [Fact]
    public async Task A_tag_from_an_ingredient_only_category_on_a_recipe_is_saved_with_a_warning()
    {
        // The "Food role" category is shown for ingredients only.
        var categories = await client.GetJson<JsonElement>("/api/ingredient-tag-categories");
        var ingredientOnlyTag = categories.EnumerateArray()
            .First(category => !category.GetProperty("showForRecipes").GetBoolean())
            .GetProperty("tags")[0].GetProperty("name").GetString()!;

        var result = await client.Import(new { recipes = new[] { new { name = "IM tag scope", portions = 2, tags = new[] { "Dinner", ingredientOnlyTag }, ingredients = new[] { new { name = "Rice", amount = 1, unit = "g" } } } } });

        var recipe = result.Item("recipes", "IM tag scope");
        Assert.Equal("created", recipe.Status());
        Assert.Contains("not used for recipes", string.Join(" ", recipe.Strings("warnings")));
    }

    [Fact]
    public async Task An_unknown_recipe_id_is_404()
    {
        var response = await client.GetAsync("/api/assistant/recipes/987654");
        await response.EnsureStatus(HttpStatusCode.NotFound);
    }
}
