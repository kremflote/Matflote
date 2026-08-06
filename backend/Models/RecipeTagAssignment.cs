// MATFLOTE: EF Core entity/model for RecipeTagAssignment data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

namespace DinnerPlanner.Api.Models;

public class RecipeTagAssignment
{
    public int RecipeId { get; set; }
    public Recipe Recipe { get; set; } = null!;
    public int IngredientTagDefinitionId { get; set; }
    public IngredientTagDefinition TagDefinition { get; set; } = null!;
}
