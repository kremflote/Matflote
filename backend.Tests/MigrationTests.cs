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
}
