using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public abstract class Recipe
{
    [Key]
    public int RecipeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public ICollection<Ingredient> Ingredients { get; set; } = [];
}

public class Dish : Recipe
{
    public ICollection<DishTypeAssignment> Types { get; set; } = [];
    public Cuisine Cuisine { get; set; } = Cuisine.Other;
}

public class Dessert : Recipe
{
    public DessertType Type { get; set; } = DessertType.Other;
}

public class Sauce : Recipe;

public class Dip : Recipe;

public class Side : Recipe;

public class SpiceMix : Recipe;
