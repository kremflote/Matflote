// MATFLOTE: Resolves where uploaded and seeded images live on disk.
// Note: The default is local wwwroot/images, while Docker can redirect image data into a persistent volume.

namespace DinnerPlanner.Api.Services;

public sealed class ImageStoragePathProvider
{
    public ImageStoragePathProvider(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var webRootPath = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var defaultRootPath = Path.Combine(webRootPath, "images");
        var configuredRootPath = configuration["ImageStorage:RootPath"];

        RootPath = ResolvePath(environment.ContentRootPath, configuredRootPath, defaultRootPath);
        SeedRootPath = Path.Combine(environment.ContentRootPath, "SeedImages");
    }

    public string RootPath { get; }

    public string SeedRootPath { get; }

    public string GetFolderPath(string folder) => Path.Combine(RootPath, folder);

    /// <summary>The full path of a file in image storage, or null when the relative path leads outside it.</summary>
    public string? ResolveFile(string relativePath)
    {
        var rootPath = Path.GetFullPath(RootPath);
        var fullPath = Path.GetFullPath(Path.Combine(rootPath, relativePath));
        return fullPath.StartsWith(rootPath + Path.DirectorySeparatorChar, StringComparison.Ordinal) ? fullPath : null;
    }

    private static string ResolvePath(string contentRootPath, string? configuredPath, string defaultPath)
    {
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            return defaultPath;
        }

        return Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.GetFullPath(Path.Combine(contentRootPath, configuredPath));
    }
}
