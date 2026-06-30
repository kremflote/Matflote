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
