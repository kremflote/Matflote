// MATFLOTE: Writes consistent copies of the SQLite database: before migrations run, and on request for the nightly backup.
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

        await VacuumIntoAsync(connectionString, backupPath, cancellationToken);

        Prune(directory, fileName);
        return backupPath;
    }

    /// <summary>The folder, beside the database, that holds the copy <see cref="CreateLatestAsync"/> writes.</summary>
    public const string LatestFolderName = "backups";

    /// <summary>
    /// Writes a consistent copy of the database to <c>&lt;database folder&gt;/backups/&lt;name&gt;.latest&lt;extension&gt;</c>,
    /// for example <c>/data/backups/dinnerplanner.latest.db</c>, replacing the previous one.
    /// The copy is written to a temporary file in the same folder first and then moved into place,
    /// so a file backup that runs at the same time sees either the old copy or the new one, never half of one.
    /// Returns the path of the copy.
    /// </summary>
    public static async Task<string> CreateLatestAsync(
        string connectionString,
        string databasePath,
        CancellationToken cancellationToken = default)
    {
        var directory = Path.Combine(Path.GetDirectoryName(databasePath) ?? ".", LatestFolderName);
        Directory.CreateDirectory(directory);

        var latestPath = Path.Combine(
            directory,
            Path.GetFileNameWithoutExtension(databasePath) + ".latest" + Path.GetExtension(databasePath));
        // VACUUM INTO refuses to write over an existing file, so every call gets its own temporary name.
        var temporaryPath = $"{latestPath}.{Guid.NewGuid():N}.tmp";

        try
        {
            await VacuumIntoAsync(connectionString, temporaryPath, cancellationToken);
            File.Move(temporaryPath, latestPath, overwrite: true);
        }
        finally
        {
            File.Delete(temporaryPath);
        }

        return latestPath;
    }

    private static async Task VacuumIntoAsync(string connectionString, string path, CancellationToken cancellationToken)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString) { Pooling = false };
        await using var connection = new SqliteConnection(builder.ConnectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "VACUUM INTO $path;";
        command.Parameters.AddWithValue("$path", path);
        await command.ExecuteNonQueryAsync(cancellationToken);
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
