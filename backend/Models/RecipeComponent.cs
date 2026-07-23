namespace DinnerPlanner.Api.Models;

public class RecipeComponent
{
    public int ParentRecipeId { get; set; }
    public Recipe ParentRecipe { get; set; } = null!;

    public int ChildRecipeId { get; set; }
    public Recipe ChildRecipe { get; set; } = null!;

    public decimal Amount { get; set; }
    public MeasurementUnit Unit { get; set; } = MeasurementUnit.Gram;
    public IngredientPreparation Preparation { get; set; } = IngredientPreparation.None;
    public int SortOrder { get; set; }
}
