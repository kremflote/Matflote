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
}
