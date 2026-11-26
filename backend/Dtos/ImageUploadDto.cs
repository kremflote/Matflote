namespace DinnerPlanner.Api.Dtos;

public record ImageUploadDto(
    string FileName,
    string Url,
    string? ThumbnailUrl
);
