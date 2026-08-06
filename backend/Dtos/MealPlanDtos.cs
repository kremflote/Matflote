// MATFLOTE: Request/response contracts for MealPlan API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

using System.ComponentModel.DataAnnotations;
using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Dtos;

public record MealPlanRecipeRequest(
    int? RecipeId,
    int? IngredientId,
    MealRecipeRole Role,
    int SortOrder,
    decimal? Portions,
    decimal? Amount,
    MeasurementUnit? Unit
);

public record MealPlanEntryRequest(
    DateOnly Date,
    MealSlot Slot,
    [StringLength(500)]
    string? Notes,
    [Required]
    IReadOnlyCollection<MealPlanRecipeRequest> Recipes
);

public record MealPlanRecipeDto(
    int MealPlanRecipeId,
    int? RecipeId,
    int? IngredientId,
    MealRecipeRole Role,
    int SortOrder,
    decimal? Portions,
    decimal? Amount,
    MeasurementUnit? Unit
);

public record MealPlanEntryDto(
    int MealPlanEntryId,
    DateOnly Date,
    MealSlot Slot,
    string? Notes,
    IReadOnlyCollection<MealPlanRecipeDto> Recipes
);
