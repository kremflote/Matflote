using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace DinnerPlanner.Api.Tests;

public class DatabaseBackupTests : IDisposable
{
    private readonly string directory = MatfloteFactory.CreateTempDirectory();

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

    private MatfloteFactory Factory() => new() { Directory = directory, DeleteDirectoryOnDispose = false };

    private string[] Backups() => Directory.GetFiles(directory, "*.bak").Select(Path.GetFileName).Order().ToArray()!;

    private static DinnerPlannerContext OpenContext(string connectionString) =>
        new(new DbContextOptionsBuilder<DinnerPlannerContext>().UseSqlite(connectionString).Options);

    private static List<string> AppliedMigrations(string path)
    {
        using var context = OpenContext($"Data Source={path};Pooling=False");
        return context.Database.GetAppliedMigrations().ToList();
    }

    /// <summary>Starts the app once against the factory's folder and stops it again.</summary>
    private static void StartAndStop(MatfloteFactory factory)
    {
        using (factory)
        {
            using var client = factory.CreateClient();
        }

        SqliteConnection.ClearAllPools();
    }

    [Fact]
    public async Task Starting_against_a_database_with_a_pending_migration_writes_a_copy_first()
    {
        var factory = Factory();
        List<string> allMigrations;
        await using (var context = OpenContext(factory.ConnectionString))
        {
            allMigrations = context.Database.GetMigrations().ToList();
        }

        Assert.True(allMigrations.Count >= 2);
        var secondToLast = allMigrations[^2];

        await using (var context = OpenContext(factory.ConnectionString))
        {
            await context.GetService<IMigrator>().MigrateAsync(secondToLast);
        }

        SqliteConnection.ClearAllPools();

        StartAndStop(factory);

        var backup = Assert.Single(Backups());
        Assert.Matches(@"^matflote-test\.db\.\d{8}-\d{6}\.bak$", backup);
        // The copy is the database as it was before the migration ran.
        Assert.Equal(allMigrations[..^1], AppliedMigrations(Path.Combine(directory, backup)));
        Assert.Equal(allMigrations, AppliedMigrations(factory.DatabasePath));

        // A second start has nothing to migrate and writes no new copy.
        StartAndStop(Factory());
        Assert.Single(Backups());
    }

    [Fact]
    public void A_new_database_gets_no_copy()
    {
        var factory = Factory();
        StartAndStop(factory);

        Assert.True(File.Exists(factory.DatabasePath));
        Assert.Empty(Backups());
    }

    [Fact]
    public async Task Only_the_newest_five_copies_are_kept()
    {
        var databasePath = Path.Combine(directory, "keep.db");
        var connectionString = $"Data Source={databasePath}";
        await using (var connection = new SqliteConnection(connectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "CREATE TABLE Marker (Value TEXT); INSERT INTO Marker VALUES ('kept');";
            await command.ExecuteNonQueryAsync();
        }

        var unrelated = Path.Combine(directory, "other.db.20200101-000000.bak");
        await File.WriteAllTextAsync(unrelated, "not ours");

        var start = new DateTime(2026, 1, 1, 12, 0, 0);
        var created = new List<string>();
        for (var i = 0; i < 7; i++)
        {
            created.Add(Path.GetFileName(await DatabaseBackup.CreateAsync(connectionString, databasePath, start.AddMinutes(i))));
        }

        // Same timestamp twice gets a suffix instead of overwriting.
        var sameSecond = Path.GetFileName(await DatabaseBackup.CreateAsync(connectionString, databasePath, start.AddMinutes(6)));
        Assert.Equal("keep.db.20260101-120600-2.bak", sameSecond);

        var kept = Directory.GetFiles(directory, "keep.db.*.bak").Select(Path.GetFileName).Order().ToArray();
        Assert.Equal(DatabaseBackup.KeepCount, kept.Length);
        Assert.Equal(created.Skip(3).Append(sameSecond).Order().ToArray(), kept);
        Assert.True(File.Exists(unrelated));

        await using var copy = new SqliteConnection($"Data Source={Path.Combine(directory, sameSecond)};Mode=ReadOnly;Pooling=False");
        await copy.OpenAsync();
        await using var read = copy.CreateCommand();
        read.CommandText = "SELECT Value FROM Marker";
        Assert.Equal("kept", await read.ExecuteScalarAsync());
    }

    [Theory]
    [InlineData("Data Source=:memory:")]
    [InlineData("Data Source=file:memdb?mode=memory&cache=shared")]
    public void In_memory_databases_have_no_path(string connectionString)
    {
        Assert.Null(DatabaseBackup.ResolveDatabasePath(connectionString));
    }
}
