using DinnerPlanner.Api.Contexts;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace DinnerPlanner.Api.Tests;

/// <summary>Runs single migrations against a database in the state the owner's could be in.</summary>
public class MigrationTests : IDisposable
{
    private readonly string directory = MatfloteFactory.CreateTempDirectory();

    private string ConnectionString => $"Data Source={Path.Combine(directory, "migration.db")};Pooling=False";

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        try
        {
            Directory.Delete(directory, recursive: true);
        }
        catch (IOException)
        {
        }
    }

    private DinnerPlannerContext OpenContext() =>
        new(new DbContextOptionsBuilder<DinnerPlannerContext>().UseSqlite(ConnectionString).Options);

    /// <summary>Migrates to the migration just before <paramref name="migrationSuffix"/>.</summary>
    private async Task MigrateToJustBefore(string migrationSuffix)
    {
        await using var context = OpenContext();
        var migrations = context.Database.GetMigrations().ToList();
        var index = migrations.FindIndex(migration => migration.EndsWith(migrationSuffix, StringComparison.Ordinal));
        Assert.True(index > 0, $"No migration ending in {migrationSuffix}.");
        await context.GetService<IMigrator>().MigrateAsync(migrations[index - 1]);
    }

    private async Task Execute(string sql)
    {
        await using var context = OpenContext();
        await context.Database.ExecuteSqlRawAsync(sql);
    }

    private async Task<List<string?>> Strings(string sql)
    {
        await using var connection = new SqliteConnection(ConnectionString);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await using var reader = await command.ExecuteReaderAsync();
        var values = new List<string?>();
        while (await reader.ReadAsync())
        {
            values.Add(reader.IsDBNull(0) ? null : reader.GetString(0));
        }

        return values;
    }

    [Fact]
    public async Task Seed_photo_urls_move_from_png_to_jpg_and_nothing_else_changes()
    {
        await MigrateToJustBefore("_ReplaceSeedRecipePngsWithJpegs");

        // Recipe 2 got its own photo; recipe 3 still uses the old sample; an ingredient borrowed one too.
        await Execute("""
            UPDATE Recipes SET ImageUrl = '/images/recipes/0123abcd.jpg' WHERE RecipeId = 2;
            INSERT INTO Recipes (Name, ImageUrl, Portions) VALUES ('Owner bowl', '/images/recipes/chicken-rice-bowl.png', 2);
            INSERT INTO Recipes (Name, ImageUrl, Portions) VALUES ('No photo', NULL, 1);
            UPDATE Ingredients SET ImageUrl = '/images/recipes/garlic-yogurt-sauce.png' WHERE IngredientId = 1;
            INSERT INTO UploadedImages (FileName, PublicUrl, RelativePath, Folder, Source, SizeBytes, CreatedAt)
                VALUES ('chicken-rice-bowl.png', '/images/recipes/chicken-rice-bowl.png', 'recipes/chicken-rice-bowl.png', 'recipes', 'Seed', 2641833, '2026-07-01 00:00:00+00:00'),
                       ('0123abcd.jpg', '/images/recipes/0123abcd.jpg', 'recipes/0123abcd.jpg', 'recipes', 'Upload', 1000, '2026-07-01 00:00:00+00:00');
            """);

        await using (var context = OpenContext())
        {
            await context.Database.MigrateAsync();
        }

        Assert.Equal(
            ["/images/recipes/garlic-yogurt-sauce.jpg", "/images/recipes/0123abcd.jpg", "/images/recipes/chicken-rice-bowl.jpg", null],
            await Strings("SELECT ImageUrl FROM Recipes WHERE RecipeId IN (1, 2) OR Name IN ('Owner bowl', 'No photo') ORDER BY RecipeId"));
        Assert.Equal(
            ["/images/recipes/garlic-yogurt-sauce.jpg"],
            await Strings("SELECT ImageUrl FROM Ingredients WHERE IngredientId = 1"));
        Assert.Equal(
            ["/images/recipes/0123abcd.jpg"],
            await Strings("SELECT PublicUrl FROM UploadedImages ORDER BY PublicUrl"));
    }

    [Fact]
    public async Task Adding_ratings_keeps_every_recipe_and_leaves_them_unrated()
    {
        await MigrateToJustBefore("_AddRecipeRating");
        await Execute("INSERT INTO Recipes (Name, Description, Portions) VALUES ('Owner stew', 'Family favourite', 4);");

        await using (var context = OpenContext())
        {
            await context.Database.MigrateAsync();
        }

        Assert.Equal(
            ["Owner stew|Family favourite|4|-|-"],
            await Strings("SELECT Name || '|' || Description || '|' || Portions || '|' || coalesce(Rating, '-') || '|' || coalesce(RatingNote, '-') FROM Recipes WHERE Name = 'Owner stew'"));
        Assert.Equal(["0"], await Strings("SELECT CAST(count(*) AS TEXT) FROM Recipes WHERE Rating IS NOT NULL OR RatingNote IS NOT NULL"));
    }

    [Fact]
    public async Task Behaviour_keys_go_on_existing_tags_by_name_and_no_tag_is_added_or_taken()
    {
        await MigrateToJustBefore("_AddBehaviourSystemKeys");
        // As an owner's database could be: Vegetable renamed to Norwegian, Dip already carrying a key of its own,
        // and a second "saus" beside the seeded Sauce.
        await Execute("""
            UPDATE IngredientTagDefinitions SET Name = 'Grønnsaker' WHERE Name = 'Vegetable';
            UPDATE IngredientTagDefinitions SET SystemKey = 'Owner.Dip' WHERE Name = 'Dip';
            INSERT INTO IngredientTagDefinitions (Name, SortOrder, IsSystemTag, IngredientTagCategoryId) VALUES ('saus', 900, 0, 3);
            """);
        var tagsBefore = await Strings("SELECT Name FROM IngredientTagDefinitions ORDER BY IngredientTagDefinitionId");

        await using (var context = OpenContext())
        {
            await context.Database.MigrateAsync();
        }

        Assert.Equal(tagsBefore, await Strings("SELECT Name FROM IngredientTagDefinitions ORDER BY IngredientTagDefinitionId"));
        Assert.Equal(
            [
                "Berry=Produce.Berry", "Dairy=Food.Dairy", "Dip=Owner.Dip", "Frozen=Storage.Frozen", "Fruit=Produce.Fruit",
                "Grain=Food.Grain", "Grønnsaker=Produce.Vegetable", "Herb=Produce.Herb", "LeafyGreen=Produce.LeafyGreen",
                "RootVegetable=Produce.RootVegetable", "Salad=FoodRole.Salad", "Sauce=FoodRole.Sauce", "Side=FoodRole.Side", "Spice=Food.Spice",
            ],
            await Strings("SELECT Name || '=' || SystemKey FROM IngredientTagDefinitions WHERE SystemKey IS NOT NULL ORDER BY Name"));
        Assert.Equal(["0"], await Strings("SELECT CAST(count(*) AS TEXT) FROM IngredientTagDefinitions WHERE IsSystemTag = 1"));

        // Running it again (as on a database restored from before) changes nothing.
        await using (var context = OpenContext())
        {
            var migrations = context.Database.GetMigrations().ToList();
            await context.GetService<IMigrator>().MigrateAsync(migrations[migrations.FindIndex(name => name.EndsWith("_AddBehaviourSystemKeys", StringComparison.Ordinal)) - 1]);
            await context.Database.MigrateAsync();
        }

        Assert.Equal(12 + 2, (await Strings("SELECT SystemKey FROM IngredientTagDefinitions WHERE SystemKey IS NOT NULL")).Count);
    }

    [Fact]
    public async Task Dropping_the_sample_rows_from_the_model_keeps_them_in_the_database()
    {
        await MigrateToJustBefore("_RemoveSampleSeedRowsFromModel");
        // The owner may have renamed a sample and used it in a recipe of their own.
        await Execute("""
            UPDATE Ingredients SET IngredientName = 'Kyllingfilet' WHERE IngredientId = 1;
            INSERT INTO Recipes (Name, Portions) VALUES ('Owner wraps', 2);
            INSERT INTO RecipeIngredients (RecipeId, IngredientId, Amount, Unit, Preparation)
                SELECT RecipeId, 1, 300, 'Gram', 'None' FROM Recipes WHERE Name = 'Owner wraps';
            """);
        const string everything = """
            SELECT 'i' || IngredientId || IngredientName FROM Ingredients
            UNION ALL SELECT 'r' || RecipeId || Name FROM Recipes
            UNION ALL SELECT 'l' || RecipeIngredientId || '-' || RecipeId || '-' || IngredientId FROM RecipeIngredients
            UNION ALL SELECT 't' || IngredientId || '-' || IngredientTagDefinitionId FROM IngredientTagAssignments
            ORDER BY 1
            """;
        var before = await Strings(everything);
        Assert.Contains("i1Kyllingfilet", before);

        await using (var context = OpenContext())
        {
            await context.Database.MigrateAsync();
            Assert.False(context.Database.HasPendingModelChanges());
        }

        Assert.Equal(before, await Strings(everything));
    }

    [Fact]
    public async Task Dropping_the_unused_nutrition_fields_keeps_every_ingredient_and_its_other_values()
    {
        await MigrateToJustBefore("_DropUnusedNutritionFields");
        await Execute("""
            INSERT INTO Ingredients (IngredientName, NutritionSource, NutritionPer100_Calories, NutritionPer100_VitaminCMilligrams,
                NutritionPer100_VitaminKMicrograms, NutritionPer100_CholineMilligrams, NutritionPer100_Vitamins, Color)
            VALUES ('Owner kale', 'Matvaretabellen', 49, 93.4, 389.6, 0.5, 'VitaminC', '#2f6b2f');
            INSERT INTO Recipes (Name, Portions) VALUES ('Owner kale salad', 2);
            INSERT INTO RecipeIngredients (RecipeId, IngredientId, Amount, Unit, Preparation)
                SELECT r.RecipeId, i.IngredientId, 150, 'Gram', 'Raw' FROM Recipes r, Ingredients i
                WHERE r.Name = 'Owner kale salad' AND i.IngredientName = 'Owner kale';
            """);
        const string kept = """
            SELECT i.IngredientId || '|' || i.IngredientName || '|' || coalesce(i.NutritionPer100_Calories, '-') || '|'
                || coalesce(i.NutritionPer100_VitaminCMilligrams, '-') || '|' || coalesce(i.Color, '-') || '|' || i.NutritionSource
            FROM Ingredients i ORDER BY i.IngredientId
            """;
        var before = await Strings(kept);
        var linesBefore = await Strings("SELECT RecipeIngredientId || '-' || RecipeId || '-' || IngredientId FROM RecipeIngredients ORDER BY 1");

        await using (var context = OpenContext())
        {
            await context.Database.MigrateAsync();
        }

        Assert.Equal(before, await Strings(kept));
        Assert.Contains(before, row => row!.Contains("|Owner kale|49|93.4|#2f6b2f|Matvaretabellen", StringComparison.Ordinal));
        Assert.Equal(linesBefore, await Strings("SELECT RecipeIngredientId || '-' || RecipeId || '-' || IngredientId FROM RecipeIngredients ORDER BY 1"));
        Assert.Empty(await Strings("SELECT name FROM pragma_table_info('Ingredients') WHERE name IN ('NutritionPer100_Vitamins', 'NutritionPer100_VitaminKMicrograms', 'NutritionPer100_CholineMilligrams')"));
    }
}
