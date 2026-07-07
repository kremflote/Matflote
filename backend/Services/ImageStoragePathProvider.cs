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
