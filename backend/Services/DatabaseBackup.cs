// MATFLOTE: Writes a consistent copy of the SQLite database before migrations run.
// Note: The copy is made with VACUUM INTO, so it is safe even while the database is in WAL mode.

using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Data.Sqlite;

namespace DinnerPlanner.Api.Services;

public static class DatabaseBackup
{
    public const int KeepCount = 5;

    /// <summary>
    /// Returns the full path of the SQLite file the connection string points at,
    /// or null for in-memory databases.
    /// </summary>
    public static string? ResolveDatabasePath(string connectionString)
    {
        var dataSource = new SqliteConnectionStringBuilder(connectionString).DataSource;
        if (string.IsNullOrWhiteSpace(dataSource)
            || dataSource == ":memory:"
            || dataSource.StartsWith("file:", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        // Microsoft.Data.Sqlite resolves relative paths against the current directory.
        return Path.GetFullPath(dataSource);
    }

    /// <summary>
    /// Writes <c>&lt;file&gt;.&lt;yyyyMMdd-HHmmss&gt;.bak</c> beside the database and removes
    /// all but the newest <see cref="KeepCount"/> copies. Returns the path of the new copy.
    /// </summary>
    public static async Task<string> CreateAsync(
        string connectionString,
        string databasePath,
        DateTime timestamp,
        CancellationToken cancellationToken = default)
    {
        var directory = Path.GetDirectoryName(databasePath) ?? ".";
        var fileName = Path.GetFileName(databasePath);
        var stamp = timestamp.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);

        var backupPath = Path.Combine(directory, $"{fileName}.{stamp}.bak");
        for (var attempt = 2; File.Exists(backupPath); attempt++)
        {
            backupPath = Path.Combine(directory, $"{fileName}.{stamp}-{attempt}.bak");
        }

        var builder = new SqliteConnectionStringBuilder(connectionString) { Pooling = false };
        await using (var connection = new SqliteConnection(builder.ConnectionString))
        {
            await connection.OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = "VACUUM INTO $path;";
            command.Parameters.AddWithValue("$path", backupPath);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        Prune(directory, fileName);
        return backupPath;
    }

    private static void Prune(string directory, string fileName)
    {
        var pattern = new Regex(
            "^" + Regex.Escape(fileName) + @"\.\d{8}-\d{6}(-\d+)?\.bak$",
            RegexOptions.CultureInvariant);

        var stale = Directory.EnumerateFiles(directory, fileName + ".*.bak")
            .Where(path => pattern.IsMatch(Path.GetFileName(path)))
            .OrderByDescending(path => File.GetLastWriteTimeUtc(path))
            .ThenByDescending(path => Path.GetFileName(path), StringComparer.Ordinal)
            .Skip(KeepCount);

        foreach (var path in stale)
        {
            File.Delete(path);
        }
    }
}
