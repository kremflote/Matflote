using System.ComponentModel.DataAnnotations;
using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Dtos;

public record DessertRequest(
    [property: Required]
    [property: StringLength(160, MinimumLength = 1)]
    string Name,
    string? ImageUrl,
    [property: StringLength(600)]
    string? Description,
    string? Instructions,
    [property: Required]
    IReadOnlyCollection<int> IngredientIds,
    DessertType Type
);

public record DessertDto(
    int RecipeId,
    RecipeType RecipeType,
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    IReadOnlyCollection<IngredientDto> Ingredients,
    DessertType Type
);
