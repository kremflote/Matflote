using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeDto>>> GetRecipes([FromQuery] RecipeType? type)
    {
        var recipes = await context.Recipes
            .AsNoTracking()
            .Include(recipe => recipe.Ingredients)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync();

        if (type is not null)
        {
            recipes = recipes.Where(recipe => ToType(recipe) == type.Value).ToList();
        }

        return Ok(recipes.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecipeDto>> GetRecipe(int id)
    {
        var recipe = await context.Recipes
            .AsNoTracking()
            .Include(recipe => recipe.Ingredients)
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

        return recipe is null ? NotFound() : Ok(ToDto(recipe));
    }

    [HttpPost]
    public async Task<ActionResult<RecipeDto>> CreateRecipe(RecipeRequest request)
    {
        if (request.RecipeType is RecipeType.Dish or RecipeType.Dessert)
        {
            return BadRequest("Use the dishes or desserts endpoint for that recipe type.");
        }

        var ingredients = await GetIngredients(request.IngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(request.IngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var recipe = CreateRecipeModel(request);
        recipe.Ingredients = ingredients;

        context.Recipes.Add(recipe);
        await context.SaveChangesAsync();

        var created = await LoadRecipe(recipe.RecipeId);
        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.RecipeId }, ToDto(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateRecipe(int id, RecipeRequest request)
    {
        var recipe = await context.Recipes
            .Include(recipe => recipe.Ingredients)
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

        if (recipe is null)
        {
            return NotFound();
        }

        if (recipe is Dish or Dessert)
        {
            return BadRequest("Use the dishes or desserts endpoint for that recipe type.");
        }

        if (ToType(recipe) != request.RecipeType)
        {
            return BadRequest("Recipe type cannot be changed.");
        }

        var ingredients = await GetIngredients(request.IngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(request.IngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        recipe.Ingredients = ingredients;

        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRecipe(int id)
    {
        var recipe = await context.Recipes.FindAsync(id);
        if (recipe is null)
        {
            return NotFound();
        }

        context.Recipes.Remove(recipe);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private Task<Recipe?> LoadRecipe(int id) => context.Recipes
        .AsNoTracking()
        .Include(recipe => recipe.Ingredients)
        .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

    private async Task<List<Ingredient>> GetIngredients(IReadOnlyCollection<int> ingredientIds)
    {
        var ids = ingredientIds.Distinct().ToList();

        return await context.Ingredients
            .Where(ingredient => ids.Contains(ingredient.IngredientId))
            .ToListAsync();
    }

    private static List<int> GetMissingIngredientIds(
        IReadOnlyCollection<int> requestedIngredientIds,
        IReadOnlyCollection<Ingredient> ingredients
    )
    {
        var existingIds = ingredients.Select(ingredient => ingredient.IngredientId);
        return requestedIngredientIds.Distinct().Except(existingIds).ToList();
    }

    private static Recipe CreateRecipeModel(RecipeRequest request)
    {
        Recipe recipe = request.RecipeType switch
        {
            RecipeType.Sauce => new Sauce(),
            RecipeType.Dip => new Dip(),
            RecipeType.Side => new Side(),
            RecipeType.SpiceMix => new SpiceMix(),
            _ => throw new ArgumentOutOfRangeException(nameof(request), "Unsupported recipe type.")
        };

        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        return recipe;
    }

    private static RecipeDto ToDto(Recipe recipe) => new(
        recipe.RecipeId,
        ToType(recipe),
        recipe.Name,
        recipe.ImageUrl,
        recipe.Description,
        recipe.Instructions,
        recipe.Ingredients.Select(ToDto).ToList()
    );

    private static RecipeType ToType(Recipe recipe) => recipe switch
    {
        Dish => RecipeType.Dish,
        Dessert => RecipeType.Dessert,
        Sauce => RecipeType.Sauce,
        Dip => RecipeType.Dip,
        Side => RecipeType.Side,
        SpiceMix => RecipeType.SpiceMix,
        _ => throw new ArgumentOutOfRangeException(nameof(recipe), "Unsupported recipe type.")
    };

    private static IngredientDto ToDto(Ingredient ingredient) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Brand,
        ingredient.Price,
        ingredient.Amount,
        ingredient.Unit,
        ingredient.Category,
        ingredient.NutritionPer100,
        ingredient.Color
    );
}
