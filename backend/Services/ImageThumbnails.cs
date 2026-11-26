// MATFLOTE: Looks up the thumbnail stored for an image URL.
// Note: One small query per response; the table holds one row per stored image.

using DinnerPlanner.Api.Contexts;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class ImageThumbnails(DinnerPlannerContext context)
{
    /// <summary>Thumbnail URL by image URL, for every image that has one.</summary>
    public async Task<IReadOnlyDictionary<string, string>> LoadAsync(CancellationToken cancellationToken = default) =>
        await context.UploadedImages
            .AsNoTracking()
            .Where(image => image.ThumbnailUrl != null)
            .ToDictionaryAsync(image => image.PublicUrl, image => image.ThumbnailUrl!, StringComparer.Ordinal, cancellationToken);

    public static string? Find(IReadOnlyDictionary<string, string> thumbnails, string? imageUrl) =>
        imageUrl is not null && thumbnails.TryGetValue(imageUrl, out var thumbnailUrl) ? thumbnailUrl : null;
}
