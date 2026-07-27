using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record RecipeRequest(
    [Required]
    [StringLength(30, MinimumLength = 1)]
    string Name,
    string? ImageUrl,
    [StringLength(600)]
    string? Description,
    string? Instructions,
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    decimal Portions,
    [Required]
    IReadOnlyCollection<RecipeIngredientRequest> Ingredients,
    [Required]
    IReadOnlyCollection<string> Tags,
    IReadOnlyCollection<RecipeComponentRequest>? Components
);

public record RecipeIngredientRequest(
    int IngredientId,
    [Range(typeof(decimal), "0", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    decimal? Amount,
    MeasurementUnit Unit,
    IngredientPreparation Preparation
);

public record RecipeComponentRequest(
    int RecipeId,
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    decimal Amount,
    MeasurementUnit Unit,
    IngredientPreparation Preparation,
    int SortOrder
);

public record RecipeDto(
    int RecipeId,
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    decimal Portions,
    IReadOnlyCollection<RecipeIngredientDto> Ingredients,
    IReadOnlyCollection<string> Tags,
    IReadOnlyCollection<RecipeComponentDto> Components
);

public record RecipeIngredientDto(
    int RecipeIngredientId,
    IngredientDto Ingredient,
    decimal? Amount,
    MeasurementUnit Unit,
    IngredientPreparation Preparation
);

public record RecipeComponentDto(
    int RecipeId,
    string Name,
    string? ImageUrl,
    decimal Amount,
    MeasurementUnit Unit,
    IngredientPreparation Preparation,
    int SortOrder,
    IReadOnlyCollection<RecipeIngredientDto> Ingredients
);
