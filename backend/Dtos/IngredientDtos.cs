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
    [Range(typeof(decimal), "0", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    decimal? Price,
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
    decimal? Price,
    IReadOnlyCollection<string> Tags,
    NutritionFacts? NutritionPer100,
    NutritionDataSource NutritionSource,
    string? NutritionSourceLabel,
    string? MatvaretabellenFoodId,
    string? NutritionMatchedName,
    decimal? NutritionMatchConfidence,
    string? Color
);
