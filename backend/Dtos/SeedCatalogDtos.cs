using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Dtos;

public record SeedCatalogDto(
    IReadOnlyCollection<SeedBrandDto>? Brands,
    IReadOnlyCollection<SeedCuisineDto>? Cuisines,
    IReadOnlyCollection<SeedIngredientDto>? Ingredients,
    IReadOnlyCollection<SeedRecipeDto>? Recipes
);

public record SeedBrandDto(string Name);

public record SeedCuisineDto(string Name);

public record SeedIngredientDto(
    string IngredientName,
    string? Description,
    string? BrandName,
    string? ImageUrl,
    decimal? Price,
    IReadOnlyCollection<string>? Tags,
    NutritionFacts? NutritionPer100,
    string? Color
);

public record SeedRecipeDto(
    RecipeType RecipeType,
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    IReadOnlyCollection<SeedRecipeIngredientDto>? Ingredients,
    IReadOnlyCollection<RecipeTag>? Tags,
    IReadOnlyCollection<SeedRecipeComponentDto>? Components,
    string? CuisineName,
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
    int? SortOrder
);
