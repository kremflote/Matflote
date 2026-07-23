namespace DinnerPlanner.Api.Models;

public class RecipeTagAssignment
{
    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;

    public string Tag { get; set; } = string.Empty;
}
