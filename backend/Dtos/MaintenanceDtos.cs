// MATFLOTE: Request/response contracts for Maintenance API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

namespace DinnerPlanner.Api.Dtos;

public record ImageCleanupReportDto(
    IReadOnlyCollection<ImageCleanupItemDto> UnusedUploadedImages,
    IReadOnlyCollection<ImageCleanupItemDto> UntrackedImageFiles
);

public record ImageCleanupItemDto(
    string PublicUrl,
    string RelativePath,
    long? SizeBytes
);
