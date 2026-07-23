using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Dtos;

public record SeedCatalogDto(
    IReadOnlyCollection<SeedBrandDto>? Brands,
    IReadOnlyCollection<SeedIngredientDto>? Ingredients,
    IReadOnlyCollection<SeedRecipeDto>? Recipes
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
    RecipeType RecipeType,
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    decimal? Portions,
    IReadOnlyCollection<SeedRecipeIngredientDto>? Ingredients,
    IReadOnlyCollection<string>? Tags,
    IReadOnlyCollection<SeedRecipeComponentDto>? Components,
    DessertType? DessertType
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
    RecipeType? RecipeType,
    decimal? Amount,
    MeasurementUnit? Unit,
    IngredientPreparation? Preparation,
    int? SortOrder
);
