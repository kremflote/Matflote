// MATFLOTE: Connection settings for SQLite on an SD card.
// Note: The database is in WAL mode (EF Core's SQLite provider sets it when it creates the file, and it is stored
// in the file). In WAL mode synchronous=NORMAL cannot corrupt the database; it skips the fsync on every commit,
// which is the slow part on SD storage, at the cost of possibly losing the last commits on a power cut.

using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DinnerPlanner.Api.Services;

public sealed class SqlitePragmaInterceptor : DbConnectionInterceptor
{
    public const string Pragmas = "PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;";

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData) =>
        Apply(connection);

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        if (connection is not SqliteConnection)
        {
            return;
        }

        await using var command = connection.CreateCommand();
        command.CommandText = Pragmas;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static void Apply(DbConnection connection)
    {
        if (connection is not SqliteConnection)
        {
            return;
        }

        using var command = connection.CreateCommand();
        command.CommandText = Pragmas;
        command.ExecuteNonQuery();
    }
}
