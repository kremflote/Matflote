// MATFLOTE: Request/response contracts for ImageUpload API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

namespace DinnerPlanner.Api.Dtos;

public record ImageUploadDto(
    string FileName,
    string Url
);
