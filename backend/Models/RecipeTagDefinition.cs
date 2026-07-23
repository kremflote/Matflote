namespace DinnerPlanner.Api.Models;

public class RecipeTagDefinition
{
    public int RecipeTagDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int RecipeTagCategoryId { get; set; }
    public RecipeTagCategory Category { get; set; } = null!;
}
