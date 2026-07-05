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
    [Required]
    [StringLength(20, MinimumLength = 1)]
    string Name,
    string? ImageUrl,
    [StringLength(600)]
    string? Description,
    string? Instructions,
    [Required]
    IReadOnlyCollection<RecipeIngredientRequest> Ingredients,
    [Required]
    [MinLength(1)]
    IReadOnlyCollection<RecipeTag> Tags,
    int? CuisineId,
    DessertType? DessertType
);

public record RecipeIngredientRequest(
    int IngredientId,
    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    decimal? Amount,
    MeasurementUnit Unit
);

public record RecipeDto(
    int RecipeId,
    RecipeType RecipeType,
    string Name,
    string? ImageUrl,
    string? Description,
    string? Instructions,
    IReadOnlyCollection<RecipeIngredientDto> Ingredients,
    IReadOnlyCollection<RecipeTag> Tags,
    int? CuisineId,
    CuisineDto? Cuisine,
    DessertType? DessertType
);

public record RecipeIngredientDto(
    int RecipeIngredientId,
    IngredientDto Ingredient,
    decimal? Amount,
    MeasurementUnit Unit
);
