// MATFLOTE: EF Core entity/model for IngredientTagAssignment data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

namespace DinnerPlanner.Api.Models;

public class IngredientTagAssignment
{
    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;
    public int IngredientTagDefinitionId { get; set; }
    public IngredientTagDefinition TagDefinition { get; set; } = null!;
}
