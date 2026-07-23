using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public abstract class Recipe
{
    [Key]
    public int RecipeId { get; set; }
    [StringLength(30, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public decimal Portions { get; set; } = 1m;
    public ICollection<RecipeIngredient> Ingredients { get; set; } = [];
    public ICollection<RecipeTagAssignment> Tags { get; set; } = [];
    public ICollection<RecipeComponent> Components { get; set; } = [];
    public ICollection<RecipeComponent> UsedInRecipes { get; set; } = [];
}

public class Dish : Recipe;

public class Dessert : Recipe
{
    public DessertType Type { get; set; } = DessertType.Other;
}

public class Sauce : Recipe;

public class Dip : Recipe;

public class Side : Recipe;

public class SpiceMix : Recipe;
