// MATFLOTE: EF Core entity/model for ValidationLimits data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

namespace DinnerPlanner.Api.Models;

public static class ValidationLimits
{
    public const int IngredientNameMaxLength = 40;
    public const int RecipeNameMaxLength = 30;
    public const int DescriptionMaxLength = 600;
    public const int MealNotesMaxLength = 500;
}
