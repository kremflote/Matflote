using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record IngredientRequest(
    [property: Required]
    [property: StringLength(160, MinimumLength = 1)]
    string IngredientName,
    [property: StringLength(120)]
    string? Brand,
    [property: Range(typeof(decimal), "0", "79228162514264337593543950335")]
    decimal? Price,
    [property: Range(typeof(decimal), "0", "79228162514264337593543950335")]
    decimal? Amount,
    MeasurementUnit Unit,
    IngredientCategory Category,
    NutritionFacts? NutritionPer100,
    [property: StringLength(40)]
    string? Color
);

public record IngredientDto(
    int IngredientId,
    string IngredientName,
    string? Brand,
    decimal? Price,
    decimal? Amount,
    MeasurementUnit Unit,
    IngredientCategory Category,
    NutritionFacts? NutritionPer100,
    string? Color
);
