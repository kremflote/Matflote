// MATFLOTE: EF Core entity/model for Ingredient data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class Ingredient
{
    [Key]
    public int IngredientId { get; set; }
    [StringLength(ValidationLimits.IngredientNameMaxLength, MinimumLength = 1)]
    public string IngredientName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Price { get; set; }
    public ICollection<IngredientTagAssignment> Tags { get; set; } = [];
    public NutritionFacts? NutritionPer100 { get; set; }
    public NutritionDataSource NutritionSource { get; set; } = NutritionDataSource.None;
    public string? NutritionSourceLabel { get; set; }
    public string? MatvaretabellenFoodId { get; set; }
    public string? NutritionMatchedName { get; set; }
    public decimal? NutritionMatchConfidence { get; set; }
    public string? Color { get; set; }
}
