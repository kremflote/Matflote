// MATFLOTE: Request/response contracts for Recipe API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record RecipeRequest(
    [Required]
    [StringLength(ValidationLimits.RecipeNameMaxLength, MinimumLength = 1)]
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
    // A small version of the image for grids and cards; null when none has been made (use ImageUrl).
    string? ThumbnailUrl,
    string? Description,
    string? Instructions,
    decimal Portions,
    IReadOnlyCollection<RecipeIngredientDto> Ingredients,
    IReadOnlyCollection<string> Tags,
    IReadOnlyCollection<RecipeComponentDto> Components,
    // 1 to 5, or null when the household has not rated the recipe.
    int? Rating,
    string? RatingNote
);

/// <summary>Sets or clears a recipe's rating. A null rating clears the rating and the note.</summary>
public record RecipeRatingRequest(
    int? Rating,
    string? Note
);

public record RecipeIngredientDto(
    int RecipeIngredientId,
    RecipeIngredientSummaryDto Ingredient,
    decimal? Amount,
    MeasurementUnit Unit,
    IngredientPreparation Preparation
);

/// <summary>
/// The parts of an ingredient a recipe list needs. The full ingredient, with its description and
/// nutrition, comes from GET /api/ingredients.
/// </summary>
public record RecipeIngredientSummaryDto(
    int IngredientId,
    string IngredientName,
    BrandDto? Brand,
    string? ImageUrl,
    string? ThumbnailUrl,
    IReadOnlyCollection<string> Tags,
    string? Color
);

/// <summary>A component recipe by reference; its ingredients are in its own entry of the recipe list.</summary>
public record RecipeComponentDto(
    int RecipeId,
    string Name,
    decimal Amount,
    MeasurementUnit Unit,
    IngredientPreparation Preparation,
    int SortOrder
);
