using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class IngredientTagDefinition
{
    [Key]
    public int IngredientTagDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int IngredientTagCategoryId { get; set; }
    public IngredientTagCategory Category { get; set; } = null!;
}
