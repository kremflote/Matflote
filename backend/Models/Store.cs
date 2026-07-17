using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class Store
{
    [Key]
    public int StoreId { get; set; }

    [StringLength(120, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    public ICollection<IngredientPricePoint> PricePoints { get; set; } = [];
}
