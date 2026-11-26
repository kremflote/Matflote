// MATFLOTE: Reports and cleans unused uploaded image files from storage.
// Note: Seed images and referenced image URLs are protected so cleanup does not break bundled or active content.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class ImageMaintenanceService(DinnerPlannerContext context, ImageStoragePathProvider imageStorage)
{
    public async Task<ImageCleanupReportDto> GetReportAsync(CancellationToken cancellationToken = default)
    {
        var referencedUrls = await GetReferencedImageUrlsAsync(cancellationToken);
        var unusedUploadedImages = await GetUnusedUploadedImagesAsync(referencedUrls, cancellationToken);
        var untrackedFiles = await GetUntrackedImageFilesAsync(referencedUrls, cancellationToken);

        return new ImageCleanupReportDto(
            unusedUploadedImages.Select(ToDto).ToList(),
            untrackedFiles.ToList()
        );
    }

    public async Task<ImageCleanupReportDto> CleanupAsync(CancellationToken cancellationToken = default)
    {
        var referencedUrls = await GetReferencedImageUrlsAsync(cancellationToken);
        var unusedUploadedImages = await GetUnusedUploadedImagesAsync(referencedUrls, cancellationToken);
        var untrackedFiles = await GetUntrackedImageFilesAsync(referencedUrls, cancellationToken);

        foreach (var image in unusedUploadedImages)
        {
            DeleteImageFile(image.RelativePath);
            if (image.ThumbnailRelativePath is not null)
            {
                DeleteImageFile(image.ThumbnailRelativePath);
            }
        }

        foreach (var imageFile in untrackedFiles)
        {
            DeleteImageFile(imageFile.RelativePath);
        }

        context.UploadedImages.RemoveRange(unusedUploadedImages);
        await context.SaveChangesAsync(cancellationToken);

        return new ImageCleanupReportDto(
            unusedUploadedImages.Select(ToDto).ToList(),
            untrackedFiles.ToList()
        );
    }

    /// <summary>
    /// Images that recipes or ingredients use, that are in image storage and have no thumbnail yet. Driven by the
    /// URLs in use rather than by UploadedImages, because images from a package import have no row there.
    /// </summary>
    public async Task<ImagesWithoutThumbnailsDto> GetImagesWithoutThumbnailsAsync(CancellationToken cancellationToken = default)
    {
        var referencedUrls = await GetReferencedImageUrlsAsync(cancellationToken);
        var urlsWithThumbnails = (await context.UploadedImages
            .AsNoTracking()
            .Where(image => image.ThumbnailUrl != null)
            .Select(image => image.PublicUrl)
            .ToListAsync(cancellationToken))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var imageUrls = referencedUrls
            .Where(url => !urlsWithThumbnails.Contains(url))
            .Where(url => ImageStorageUrls.ToRelativePath(url) is { } relativePath
                && !ImageStorageUrls.IsThumbnail(relativePath)
                && imageStorage.ResolveFile(relativePath) is { } fullPath
                && File.Exists(fullPath))
            .Order(StringComparer.Ordinal)
            .ToList();

        return new ImagesWithoutThumbnailsDto(imageUrls);
    }

    private async Task<HashSet<string>> GetReferencedImageUrlsAsync(CancellationToken cancellationToken)
    {
        var ingredientImageUrls = await context.Ingredients
            .AsNoTracking()
            .Where(ingredient => ingredient.ImageUrl != null && ingredient.ImageUrl != "")
            .Select(ingredient => ingredient.ImageUrl!)
            .ToListAsync(cancellationToken);
        var recipeImageUrls = await context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.ImageUrl != null && recipe.ImageUrl != "")
            .Select(recipe => recipe.ImageUrl!)
            .ToListAsync(cancellationToken);

        return ingredientImageUrls
            .Concat(recipeImageUrls)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private async Task<List<UploadedImage>> GetUnusedUploadedImagesAsync(
        HashSet<string> referencedUrls,
        CancellationToken cancellationToken) =>
        await context.UploadedImages
            .Where(image => image.Source != "Seed")
            .Where(image => !referencedUrls.Contains(image.PublicUrl))
            .ToListAsync(cancellationToken);

    private async Task<IEnumerable<ImageCleanupItemDto>> GetUntrackedImageFilesAsync(
        HashSet<string> referencedUrls,
        CancellationToken cancellationToken)
    {
        if (!Directory.Exists(imageStorage.RootPath))
        {
            return [];
        }

        var trackedRows = await context.UploadedImages
            .AsNoTracking()
            .Select(image => new { image.RelativePath, image.ThumbnailRelativePath })
            .ToListAsync(cancellationToken);
        // A thumbnail belongs to its image's row, so it is tracked even though nothing references it directly.
        var trackedSet = trackedRows
            .SelectMany(row => new[] { row.RelativePath, row.ThumbnailRelativePath })
            .OfType<string>()
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return Directory
            .EnumerateFiles(imageStorage.RootPath, "*", SearchOption.AllDirectories)
            .Select(path =>
            {
                var relativePath = Path.GetRelativePath(imageStorage.RootPath, path).Replace('\\', '/');
                return new
                {
                    RelativePath = relativePath,
                    Path = path
                };
            })
            .Where(file => !trackedSet.Contains(file.RelativePath))
            .Where(file => !referencedUrls.Contains($"/images/{file.RelativePath}"))
            .Select(file =>
            {
                var fileInfo = new FileInfo(file.Path);
                return new ImageCleanupItemDto(
                    $"/images/{file.RelativePath}",
                    file.RelativePath,
                    fileInfo.Length
                );
            })
            .ToList();
    }

    private void DeleteImageFile(string relativePath)
    {
        var fullPath = Path.GetFullPath(Path.Combine(imageStorage.RootPath, relativePath));
        var rootPath = Path.GetFullPath(imageStorage.RootPath);
        if (!fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase) || !File.Exists(fullPath))
        {
            return;
        }

        File.Delete(fullPath);
    }

    private static ImageCleanupItemDto ToDto(UploadedImage image) => new(
        image.PublicUrl,
        image.RelativePath,
        image.SizeBytes
    );
}
