// MATFLOTE: EF Core entity/model for IngredientPricePoint data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class IngredientPricePoint
{
    [Key]
    public int IngredientPricePointId { get; set; }

    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;

    public int StoreId { get; set; }
    public Store Store { get; set; } = null!;

    public decimal Price { get; set; }

    public DateOnly Date { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}
