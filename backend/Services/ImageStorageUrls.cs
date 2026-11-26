// MATFLOTE: Small helpers for the /images/... URLs that point into image storage.

namespace DinnerPlanner.Api.Services;

public static class ImageStorageUrls
{
    private const string Prefix = "/images/";

    /// <summary>Thumbnail files are named "&lt;name&gt;.thumb.jpg" next to their image.</summary>
    public const string ThumbnailSuffix = ".thumb";

    /// <summary>"recipes/abc.jpg" for "/images/recipes/abc.jpg"; null for anything that is not a stored image.</summary>
    public static string? ToRelativePath(string? url)
    {
        if (string.IsNullOrWhiteSpace(url) || !url.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return null;
        }

        var relativePath = url[Prefix.Length..].Split('?', '#')[0];
        return relativePath.Length == 0 || relativePath.Contains("..", StringComparison.Ordinal) ? null : relativePath;
    }

    public static bool IsThumbnail(string relativePath) =>
        Path.GetFileNameWithoutExtension(relativePath).EndsWith(ThumbnailSuffix, StringComparison.OrdinalIgnoreCase);

    /// <summary>Whether a file name has one of the image types the app stores and serves (.jpg, .jpeg, .png, .webp).</summary>
    public static bool IsImageFileName(string fileName) => GetContentType(Path.GetExtension(fileName)) is not null;

    public static string? GetContentType(string extension) =>
        extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => null
        };
}
