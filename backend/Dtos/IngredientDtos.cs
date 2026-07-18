using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record IngredientRequest(
    [Required]
    [StringLength(30, MinimumLength = 1)]
    string IngredientName,
    [StringLength(600)]
    string? Description,
    int? BrandId,
    [StringLength(500)]
    string? ImageUrl,
    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    decimal? Price,
    IReadOnlyCollection<string> Tags,
    NutritionFacts? NutritionPer100,
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
    decimal? Price,
    IReadOnlyCollection<string> Tags,
    NutritionFacts? NutritionPer100,
    string? Color
);
