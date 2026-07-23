namespace DinnerPlanner.Api.Models;

public class RecipeTagCategory
{
    public int RecipeTagCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public ICollection<RecipeTagDefinition> Tags { get; set; } = [];
}
