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

public record IngredientTagCategoryDto(
    int IngredientTagCategoryId,
    string Name,
    IReadOnlyCollection<string> Tags
);

public record RecipeTagCategoryDto(
    int RecipeTagCategoryId,
    string Name,
    IReadOnlyCollection<string> Tags
);
