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
