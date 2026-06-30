using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record DishRequest(
    [property: Required]
    [property: StringLength(160, MinimumLength = 1)]
    string Name,
    string? ImageUrl,
    [property: StringLength(600)]
    string? Description,
    string? Instructions,
    [property: Required]
    IReadOnlyCollection<int> IngredientIds,
    [property: Required]
    IReadOnlyCollection<DishType> Types,
    Cuisine Cuisine
);

public record DishDto(
    int RecipeId,
    RecipeType RecipeType,
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    IReadOnlyCollection<IngredientDto> Ingredients,
    IReadOnlyCollection<DishType> Types,
    Cuisine Cuisine
);
