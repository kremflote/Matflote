using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class RecipeIngredient
{
    [Key]
    public int RecipeIngredientId { get; set; }
    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;
    public decimal? Amount { get; set; }
    public MeasurementUnit Unit { get; set; } = MeasurementUnit.Gram;
    public IngredientPreparation Preparation { get; set; } = IngredientPreparation.None;
}
