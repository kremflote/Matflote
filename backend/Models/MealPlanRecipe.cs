// MATFLOTE: EF Core entity/model for MealPlanRecipe data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class MealPlanRecipe
{
    [Key]
    public int MealPlanRecipeId { get; set; }

    public int MealPlanEntryId { get; set; }
    public MealPlanEntry MealPlanEntry { get; set; } = null!;

    public int? RecipeId { get; set; }
    public Recipe? Recipe { get; set; }

    public int? IngredientId { get; set; }
    public Ingredient? Ingredient { get; set; }

    public MealRecipeRole Role { get; set; } = MealRecipeRole.Main;
    public int SortOrder { get; set; }
    public decimal? Portions { get; set; }
    public decimal? Amount { get; set; }
    public MeasurementUnit? Unit { get; set; }
}
