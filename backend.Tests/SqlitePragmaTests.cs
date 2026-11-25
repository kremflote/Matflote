using DinnerPlanner.Api.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DinnerPlanner.Api.Tests;

public class SqlitePragmaTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private async Task<long> Pragma(DinnerPlannerContext context, string name)
    {
        var connection = context.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA {name};";
        var value = await command.ExecuteScalarAsync();
        return value is string text ? text switch { "wal" => 1, _ => -1 } : Convert.ToInt64(value);
    }

    [Fact]
    public async Task Every_connection_uses_wal_with_normal_sync_and_a_busy_timeout()
    {
        _ = factory.CreateClient();
        await using var scope = factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<DinnerPlannerContext>();

        await context.Database.OpenConnectionAsync();
        try
        {
            Assert.Equal(1, await Pragma(context, "journal_mode")); // wal
            Assert.Equal(1, await Pragma(context, "synchronous")); // NORMAL
            Assert.Equal(5000, await Pragma(context, "busy_timeout"));
        }
        finally
        {
            await context.Database.CloseConnectionAsync();
        }
    }

    [Fact]
    public async Task Startup_switches_a_database_restored_without_wal_back_to_wal()
    {
        var directory = MatfloteFactory.CreateTempDirectory();
        var path = Path.Combine(directory, "matflote-test.db");
        try
        {
            await using (var context = new DinnerPlannerContext(
                new DbContextOptionsBuilder<DinnerPlannerContext>().UseSqlite($"Data Source={path};Pooling=False").Options))
            {
                await context.Database.MigrateAsync();
                await context.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=DELETE;");
            }

            using (var restored = new MatfloteFactory { Directory = directory, DeleteDirectoryOnDispose = false })
            {
                _ = restored.CreateClient();
            }

            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            await using var connection = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={path};Pooling=False");
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA journal_mode;";
            Assert.Equal("wal", await command.ExecuteScalarAsync());
        }
        finally
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            try
            {
                Directory.Delete(directory, recursive: true);
            }
            catch (IOException)
            {
            }
        }
    }
}
