// MATFLOTE: API controller for ImageUploads-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageUploadsController(ImageStoragePathProvider imageStorage, DinnerPlannerContext context) : ControllerBase
{
    private const long MaxStoredImageBytes = 5 * 1024 * 1024;
    private const long MaxIncomingImageBytes = 20 * 1024 * 1024;
    private const long MaxThumbnailBytes = 512 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private static readonly HashSet<string> AllowedFolders = new(StringComparer.OrdinalIgnoreCase)
    {
        "general",
        "ingredients",
        "recipes"
    };

    /// <summary>Stores an image and, when the browser sends one, its small thumbnail.</summary>
    [HttpPost]
    [RequestSizeLimit(MaxIncomingImageBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxIncomingImageBytes)]
    public async Task<ActionResult<ImageUploadDto>> UploadImage(
        IFormFile file,
        [FromForm] string folder = "general",
        IFormFile? thumbnail = null)
    {
        if (file.Length == 0)
        {
            return BadRequest("No image file was uploaded.");
        }

        if (file.Length > MaxStoredImageBytes)
        {
            return BadRequest("Image is too large. Choose a smaller image or try again after compression.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest("Only .jpg, .jpeg, .png, and .webp images are supported.");
        }

        var thumbnailError = ValidateThumbnail(thumbnail);
        if (thumbnailError is not null)
        {
            return BadRequest(thumbnailError);
        }

        var safeFolder = MakeSafePathSegment(folder);
        if (!AllowedFolders.Contains(safeFolder))
        {
            return BadRequest($"Unsupported image folder. Use one of: {string.Join(", ", AllowedFolders.Order())}.");
        }

        var baseName = Guid.NewGuid().ToString("N");
        var fileName = $"{baseName}{extension.ToLowerInvariant()}";
        var relativePath = await SaveAsync(file, safeFolder, fileName);

        var image = new UploadedImage
        {
            FileName = fileName,
            PublicUrl = $"/images/{relativePath}",
            RelativePath = relativePath,
            Folder = safeFolder,
            Source = "Upload",
            OriginalFileName = Path.GetFileName(file.FileName),
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            CreatedAt = DateTimeOffset.UtcNow
        };

        if (thumbnail is not null)
        {
            await SaveThumbnailAsync(image, thumbnail, baseName);
        }

        context.UploadedImages.Add(image);
        await context.SaveChangesAsync();

        return Ok(new ImageUploadDto(fileName, image.PublicUrl, image.ThumbnailUrl));
    }

    /// <summary>
    /// Attaches a thumbnail, made in the browser, to an image already in storage. Images that arrived through
    /// the package import have no row in UploadedImages yet; this registers them.
    /// </summary>
    [HttpPost("thumbnail")]
    [RequestSizeLimit(MaxThumbnailBytes + 64 * 1024)]
    public async Task<ActionResult<ImageUploadDto>> AttachThumbnail([FromForm] string imageUrl, IFormFile thumbnail)
    {
        var thumbnailError = ValidateThumbnail(thumbnail);
        if (thumbnailError is not null)
        {
            return BadRequest(thumbnailError);
        }

        var relativePath = ImageStorageUrls.ToRelativePath(imageUrl);
        var fullPath = relativePath is null ? null : imageStorage.ResolveFile(relativePath);
        if (relativePath is null || fullPath is null || !System.IO.File.Exists(fullPath))
        {
            return NotFound($"No stored image at {imageUrl}.");
        }

        if (ImageStorageUrls.IsThumbnail(relativePath))
        {
            return BadRequest("That is already a thumbnail.");
        }

        var publicUrl = $"/images/{relativePath}";
        var image = await context.UploadedImages.FirstOrDefaultAsync(row => row.PublicUrl == publicUrl);
        if (image is null)
        {
            var fileInfo = new FileInfo(fullPath);
            image = new UploadedImage
            {
                FileName = fileInfo.Name,
                PublicUrl = publicUrl,
                RelativePath = relativePath,
                Folder = Path.GetDirectoryName(relativePath)?.Replace('\\', '/') is { Length: > 0 } directory ? directory : "general",
                Source = "Registered",
                OriginalFileName = fileInfo.Name,
                ContentType = ImageStorageUrls.GetContentType(fileInfo.Extension),
                SizeBytes = fileInfo.Length,
                CreatedAt = DateTimeOffset.UtcNow
            };
            context.UploadedImages.Add(image);
        }

        var previousThumbnail = image.ThumbnailRelativePath;
        // A new name each time, so a thumbnail can be cached as immutable like every other image.
        await SaveThumbnailAsync(image, thumbnail, $"{Path.GetFileNameWithoutExtension(relativePath)}-{Guid.NewGuid().ToString("N")[..8]}");
        await context.SaveChangesAsync();

        if (previousThumbnail is not null && imageStorage.ResolveFile(previousThumbnail) is { } previousPath)
        {
            System.IO.File.Delete(previousPath);
        }

        return Ok(new ImageUploadDto(image.FileName, image.PublicUrl, image.ThumbnailUrl));
    }

    private static string? ValidateThumbnail(IFormFile? thumbnail)
    {
        if (thumbnail is null)
        {
            return null;
        }

        if (thumbnail.Length == 0 || thumbnail.Length > MaxThumbnailBytes)
        {
            return $"A thumbnail must be between 1 byte and {MaxThumbnailBytes / 1024} KB.";
        }

        return AllowedExtensions.Contains(Path.GetExtension(thumbnail.FileName))
            ? null
            : "Thumbnails must be .jpg, .jpeg, .png or .webp.";
    }

    private async Task SaveThumbnailAsync(UploadedImage image, IFormFile thumbnail, string baseName)
    {
        var fileName = $"{baseName}{ImageStorageUrls.ThumbnailSuffix}{Path.GetExtension(thumbnail.FileName).ToLowerInvariant()}";
        var relativePath = await SaveAsync(thumbnail, image.Folder, fileName);
        image.ThumbnailRelativePath = relativePath;
        image.ThumbnailUrl = $"/images/{relativePath}";
    }

    private async Task<string> SaveAsync(IFormFile file, string folder, string fileName)
    {
        var uploadFolder = imageStorage.GetFolderPath(folder);
        Directory.CreateDirectory(uploadFolder);

        await using var stream = System.IO.File.Create(Path.Combine(uploadFolder, fileName));
        await file.CopyToAsync(stream);

        return Path.Combine(folder, fileName).Replace('\\', '/');
    }

    private static string MakeSafePathSegment(string value)
    {
        var safeChars = value
            .Where(character => char.IsLetterOrDigit(character) || character is '-' or '_')
            .ToArray();

        var safeValue = new string(safeChars);
        return string.IsNullOrWhiteSpace(safeValue) ? "general" : safeValue.ToLowerInvariant();
    }
}
