// MATFLOTE: EF Core entity/model for IngredientTagDefinition data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class IngredientTagDefinition
{
    [Key]
    public int IngredientTagDefinitionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int IngredientTagCategoryId { get; set; }
    public IngredientTagCategory Category { get; set; } = null!;
}
