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
