// MATFLOTE: Request/response contracts for Lookup API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record LookupRequest(
    [Required]
    [StringLength(120, MinimumLength = 1)]
    string Name
);

public record BrandDto(
    int BrandId,
    string Name
);

public record IngredientTagDto(
    int IngredientTagDefinitionId,
    string Name,
    int SortOrder
);

public record IngredientTagCategoryDto(
    int IngredientTagCategoryId,
    string Name,
    int SortOrder,
    IReadOnlyCollection<IngredientTagDto> Tags
);

public record MoveLookupRequest(
    [Required]
    [RegularExpression("^(Up|Down)$")]
    string Direction
);
