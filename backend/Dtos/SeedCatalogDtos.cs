// MATFLOTE: Request/response contracts for SeedCatalog API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Dtos;

public record SeedCatalogDto(
    IReadOnlyCollection<SeedTagCategoryDto>? TagCategories,
    IReadOnlyCollection<SeedConversionRuleDto>? ConversionRules,
    IReadOnlyCollection<SeedBrandDto>? Brands,
    IReadOnlyCollection<SeedIngredientDto>? Ingredients,
    IReadOnlyCollection<SeedRecipeDto>? Recipes
);

public record SeedTagCategoryDto(
    string Name,
    int? SortOrder,
    bool? ShowForIngredients,
    bool? ShowForRecipes,
    IReadOnlyCollection<SeedTagDto>? Tags
);

public record SeedTagDto(
    string Name,
    int? SortOrder,
    bool? IsSystemTag,
    string? SystemKey
);

public record SeedConversionRuleDto(
    string FromText,
    string ToText,
    string? FromTextNb,
    string? ToTextNb,
    int? SortOrder
);

public record SeedBrandDto(string Name);

public record SeedIngredientDto(
    string IngredientName,
    string? Description,
    string? BrandName,
    string? ImageUrl,
    decimal? Price,
    IReadOnlyCollection<string>? Tags,
    NutritionFacts? NutritionPer100,
    NutritionDataSource? NutritionSource,
    string? NutritionSourceLabel,
    string? MatvaretabellenFoodId,
    string? NutritionMatchedName,
    decimal? NutritionMatchConfidence,
    string? Color
);

public record SeedRecipeDto(
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    decimal? Portions,
    IReadOnlyCollection<SeedRecipeIngredientDto>? Ingredients,
    IReadOnlyCollection<string>? Tags,
    IReadOnlyCollection<SeedRecipeComponentDto>? Components
);

public record SeedRecipeIngredientDto(
    string IngredientName,
    string? BrandName,
    decimal? Amount,
    MeasurementUnit Unit,
    IngredientPreparation Preparation
);

public record SeedRecipeComponentDto(
    string RecipeName,
    decimal? Amount,
    MeasurementUnit? Unit,
    IngredientPreparation? Preparation,
    int? SortOrder
);
