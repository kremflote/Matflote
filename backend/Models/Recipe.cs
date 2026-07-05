using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public abstract class Recipe
{
    [Key]
    public int RecipeId { get; set; }
    [StringLength(20, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public ICollection<RecipeIngredient> Ingredients { get; set; } = [];
    public ICollection<RecipeTagAssignment> Tags { get; set; } = [];
}

public class Dish : Recipe
{
    public int? CuisineId { get; set; }
    public Cuisine? Cuisine { get; set; }
}

public class Dessert : Recipe
{
    public DessertType Type { get; set; } = DessertType.Other;
}

public class Sauce : Recipe;

public class Dip : Recipe;

public class Side : Recipe;

public class SpiceMix : Recipe;
