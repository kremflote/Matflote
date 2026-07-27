using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class Recipe
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
