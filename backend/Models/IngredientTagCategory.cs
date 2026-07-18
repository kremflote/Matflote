using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class IngredientTagCategory
{
    [Key]
    public int IngredientTagCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<IngredientTagDefinition> Tags { get; set; } = [];
}
