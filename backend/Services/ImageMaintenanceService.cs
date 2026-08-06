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

        var trackedRelativePaths = await context.UploadedImages
            .AsNoTracking()
            .Select(image => image.RelativePath)
            .ToListAsync(cancellationToken);
        var trackedSet = trackedRelativePaths.ToHashSet(StringComparer.OrdinalIgnoreCase);

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
