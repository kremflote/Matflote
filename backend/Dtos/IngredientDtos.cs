// MATFLOTE: Request/response contracts for Ingredient API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record IngredientRequest(
    [Required]
    [StringLength(ValidationLimits.IngredientNameMaxLength, MinimumLength = 1)]
    string IngredientName,
    [StringLength(600)]
    string? Description,
    int? BrandId,
    [StringLength(500)]
    string? ImageUrl,
    IReadOnlyCollection<string> Tags,
    NutritionFacts? NutritionPer100,
    NutritionDataSource? NutritionSource,
    [StringLength(160)]
    string? NutritionSourceLabel,
    [StringLength(80)]
    string? MatvaretabellenFoodId,
    [StringLength(160)]
    string? NutritionMatchedName,
    [Range(typeof(decimal), "0", "1", ParseLimitsInInvariantCulture = true)]
    decimal? NutritionMatchConfidence,
    [StringLength(40)]
    string? Color
);

public record IngredientDto(
    int IngredientId,
    string IngredientName,
    string? Description,
    int? BrandId,
    BrandDto? Brand,
    string? ImageUrl,
    // A small version of the image for grids and cards; null when none has been made (use ImageUrl).
    string? ThumbnailUrl,
    IReadOnlyCollection<string> Tags,
    NutritionFacts? NutritionPer100,
    NutritionDataSource NutritionSource,
    string? NutritionSourceLabel,
    string? MatvaretabellenFoodId,
    string? NutritionMatchedName,
    decimal? NutritionMatchConfidence,
    string? Color
);

/// <summary>A recipe that has a line for an ingredient.</summary>
public record IngredientUseRecipeDto(int RecipeId, string Name);

/// <summary>A planned meal that lists an ingredient directly.</summary>
public record IngredientUseMealDto(int MealPlanEntryId, DateOnly Date, MealSlot Slot);

/// <summary>
/// The uses that stop DELETE /api/ingredients/{id}: its 409 is ProblemDetails with <c>error</c>, <c>recipes</c> and
/// <c>mealPlanEntries</c>. Repoint the uses with POST /api/ingredients/{id}/replace-with/{otherId}, or edit them, before deleting.
/// </summary>
public record IngredientInUseDto(
    string Error,
    IReadOnlyCollection<IngredientUseRecipeDto> Recipes,
    IReadOnlyCollection<IngredientUseMealDto> MealPlanEntries
);

/// <summary>The result of replacing one ingredient with another everywhere and deleting the first.</summary>
public record IngredientReplacementResultDto(
    int DeletedIngredientId,
    IngredientDto Replacement,
    // Recipe lines that now point at the replacement.
    int RecipeLinesMoved,
    // Recipes that already had the replacement: the two lines were added into one.
    int RecipeLinesMerged,
    int MealPlanItemsMoved
);
