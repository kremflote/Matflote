namespace DinnerPlanner.Api.Models;

public class DishTypeAssignment
{
    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;

    public DishType Type { get; set; } = DishType.Other;
}
