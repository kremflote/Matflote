// MATFLOTE: EF Core entity/model for MealPlanEntry data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class MealPlanEntry
{
    [Key]
    public int MealPlanEntryId { get; set; }
    public DateOnly Date { get; set; }
    public MealSlot Slot { get; set; }
    public string? Notes { get; set; }

    public ICollection<MealPlanRecipe> Recipes { get; set; } = [];
}
