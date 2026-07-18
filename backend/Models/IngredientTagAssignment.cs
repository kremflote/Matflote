namespace DinnerPlanner.Api.Models;

public class IngredientTagAssignment
{
    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;
    public string Tag { get; set; } = string.Empty;
}
