using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public enum RecipeType
{
    Dish,
    Dessert,
    Sauce,
    Dip,
    Side,
    SpiceMix
}

public record RecipeRequest(
    RecipeType RecipeType,
    [property: Required]
    [property: StringLength(160, MinimumLength = 1)]
    string Name,
    string? ImageUrl,
    [property: StringLength(600)]
    string? Description,
    string? Instructions,
    [property: Required]
    IReadOnlyCollection<int> IngredientIds
);

public record RecipeDto(
    int RecipeId,
    RecipeType RecipeType,
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    IReadOnlyCollection<IngredientDto> Ingredients
);
