// MATFLOTE: Downloads a recipe photo an agent pointed at, so MATFLOTE stores its own copy instead of hot-linking.
// Note: http and https only, at most 5 MB, JPEG, PNG or WebP (by Content-Type and by the file's first bytes), 15 seconds.
// Private and local addresses are not blocked: the server is Tailscale-only with one user (see docs/PLAN.md).

namespace DinnerPlanner.Api.Services;

public class AssistantImageDownloader(HttpClient httpClient, ImageStoragePathProvider imageStorage)
{
    public const long MaxBytes = 5 * 1024 * 1024;
    public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(15);

    private static readonly Dictionary<string, string> ExtensionByContentType = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
    };

    public static bool IsDownloadable(string url, out Uri uri) =>
        Uri.TryCreate(url, UriKind.Absolute, out uri!) && uri.Scheme is "http" or "https";

    /// <summary>Fetches and checks the image. Returns it, or the reason it cannot be used.</summary>
    public async Task<(DownloadedImage? Image, string? Error)> DownloadAsync(Uri uri, CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(Timeout);

        try
        {
            using var response = await httpClient.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            if (!response.IsSuccessStatusCode)
            {
                return (null, $"the server answered {(int)response.StatusCode} {response.ReasonPhrase}.");
            }

            var contentType = response.Content.Headers.ContentType?.MediaType;
            if (contentType is null || !ExtensionByContentType.TryGetValue(contentType, out var extension))
            {
                return (null, $"it is \"{contentType ?? "of no stated type"}\", not a JPEG, PNG or WebP image.");
            }

            if (response.Content.Headers.ContentLength > MaxBytes)
            {
                return (null, $"it is {response.Content.Headers.ContentLength / 1024} KB; the limit is {MaxBytes / 1024 / 1024} MB.");
            }

            await using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var buffer = new MemoryStream();
            var chunk = new byte[81920];
            int read;
            while ((read = await stream.ReadAsync(chunk, timeout.Token)) > 0)
            {
                buffer.Write(chunk, 0, read);
                if (buffer.Length > MaxBytes)
                {
                    return (null, $"it is larger than {MaxBytes / 1024 / 1024} MB.");
                }
            }

            var bytes = buffer.ToArray();
            if (!LooksLike(bytes, extension))
            {
                return (null, $"its content is not a {contentType} image.");
            }

            return (new DownloadedImage(bytes, extension, contentType.ToLowerInvariant(), uri.ToString()), null);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return (null, $"it did not arrive within {Timeout.TotalSeconds:0} seconds.");
        }
        catch (HttpRequestException exception)
        {
            return (null, $"it could not be fetched ({exception.Message}).");
        }
    }

    /// <summary>Writes the image into image storage under recipes/ and returns its row, ready to add.</summary>
    public async Task<Models.UploadedImage> SaveAsync(DownloadedImage image, CancellationToken cancellationToken)
    {
        const string folder = "recipes";
        var fileName = $"{Guid.NewGuid():N}{image.Extension}";
        var directory = imageStorage.GetFolderPath(folder);
        Directory.CreateDirectory(directory);
        await File.WriteAllBytesAsync(Path.Combine(directory, fileName), image.Bytes, cancellationToken);

        var relativePath = $"{folder}/{fileName}";
        var originalName = image.SourceUrl.Length <= 260 ? image.SourceUrl : image.SourceUrl[..260];
        return new Models.UploadedImage
        {
            FileName = fileName,
            PublicUrl = $"/images/{relativePath}",
            RelativePath = relativePath,
            Folder = folder,
            Source = "Assistant",
            OriginalFileName = originalName,
            ContentType = image.ContentType,
            SizeBytes = image.Bytes.Length,
            CreatedAt = DateTimeOffset.UtcNow,
        };
    }

    private static bool LooksLike(byte[] bytes, string extension) => extension switch
    {
        ".jpg" => bytes.Length > 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
        ".png" => bytes.Length > 8 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47,
        ".webp" => bytes.Length > 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
            && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P',
        _ => false,
    };
}

public sealed record DownloadedImage(byte[] Bytes, string Extension, string ContentType, string SourceUrl);
