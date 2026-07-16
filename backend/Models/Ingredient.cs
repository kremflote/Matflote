using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class Ingredient
{
    [Key]
    public int IngredientId { get; set; }
    [StringLength(30, MinimumLength = 1)]
    public string IngredientName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Price { get; set; }
    public ICollection<IngredientTagAssignment> Tags { get; set; } = [];
    public NutritionFacts? NutritionPer100 { get; set; }
    public string? Color { get; set; }
}
