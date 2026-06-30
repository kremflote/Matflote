using System.ComponentModel.DataAnnotations;
using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Dtos;

public record MealPlanRecipeRequest(
    int RecipeId,
    MealRecipeRole Role,
    int SortOrder
);

public record MealPlanEntryRequest(
    DateOnly Date,
    MealSlot Slot,
    [property: StringLength(500)]
    string? Notes,
    [property: Required]
    IReadOnlyCollection<MealPlanRecipeRequest> Recipes
);

public record MealPlanRecipeDto(
    int MealPlanRecipeId,
    int RecipeId,
    MealRecipeRole Role,
    int SortOrder
);

public record MealPlanEntryDto(
    int MealPlanEntryId,
    DateOnly Date,
    MealSlot Slot,
    string? Notes,
    IReadOnlyCollection<MealPlanRecipeDto> Recipes
);
