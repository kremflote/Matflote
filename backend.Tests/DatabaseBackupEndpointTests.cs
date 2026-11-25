using System.Net;
using Microsoft.Data.Sqlite;

namespace DinnerPlanner.Api.Tests;

public class DatabaseBackupEndpointTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private string BackupFolder => Path.Combine(factory.Directory, "backups");

    private string LatestPath => Path.Combine(BackupFolder, "matflote-test.latest.db");

    private static async Task<long> CountRows(string databasePath, string table)
    {
        await using var connection = new SqliteConnection($"Data Source={databasePath};Mode=ReadOnly;Pooling=False");
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = $"SELECT COUNT(*) FROM \"{table}\"";
        return (long)(await command.ExecuteScalarAsync())!;
    }

    [Fact]
    public async Task Backup_writes_a_consistent_copy_into_the_backups_folder_and_replaces_it_next_time()
    {
        using var client = factory.CreateClient();

        var first = await client.PostAsync("/api/maintenance/backup", null);
        await first.EnsureStatus(HttpStatusCode.OK);
        var body = await first.ReadJson();

        Assert.Equal(LatestPath, body.GetProperty("path").GetString());
        Assert.Equal(new FileInfo(LatestPath).Length, body.GetProperty("sizeBytes").GetInt64());
        Assert.True(body.GetProperty("sizeBytes").GetInt64() > 0);
        var createdAt = body.GetProperty("createdAt").GetDateTimeOffset();
        Assert.InRange(createdAt, DateTimeOffset.UtcNow.AddMinutes(-1), DateTimeOffset.UtcNow.AddMinutes(1));

        var ingredientsBefore = await CountRows(LatestPath, "Ingredients");
        Assert.Equal(await CountRows(factory.DatabasePath, "Ingredients"), ingredientsBefore);

        var created = await client.PostJson("/api/ingredients", new { ingredientName = "Backup test salt", tags = Array.Empty<string>() });
        await created.EnsureStatus(HttpStatusCode.Created);

        var second = await client.PostAsync("/api/maintenance/backup", null);
        await second.EnsureStatus(HttpStatusCode.OK);

        // The second call replaced the copy, which now holds the new ingredient, and left no temporary file behind.
        Assert.Equal(ingredientsBefore + 1, await CountRows(LatestPath, "Ingredients"));
        Assert.Equal(["matflote-test.latest.db"], Directory.GetFiles(BackupFolder).Select(path => Path.GetFileName(path)).ToArray());
    }
}
