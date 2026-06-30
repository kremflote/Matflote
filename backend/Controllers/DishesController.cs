using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DishesController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DishDto>>> GetDishes()
    {
        var dishes = await context.Dishes
            .AsNoTracking()
            .Include(dish => dish.Ingredients)
            .Include(dish => dish.Types)
            .OrderBy(dish => dish.Name)
            .ToListAsync();

        return Ok(dishes.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DishDto>> GetDish(int id)
    {
        var dish = await context.Dishes
            .AsNoTracking()
            .Include(dish => dish.Ingredients)
            .Include(dish => dish.Types)
            .FirstOrDefaultAsync(dish => dish.RecipeId == id);

        return dish is null ? NotFound() : Ok(ToDto(dish));
    }

    [HttpPost]
    public async Task<ActionResult<DishDto>> CreateDish(DishRequest request)
    {
        var types = NormalizeTypes(request.Types);
        if (types.Count == 0)
        {
            return BadRequest("At least one dish type is required.");
        }

        var ingredients = await GetIngredients(request.IngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(request.IngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var dish = new Dish
        {
            Name = request.Name,
            ImageUrl = request.ImageUrl,
            Description = request.Description,
            Instructions = request.Instructions,
            Cuisine = request.Cuisine,
            Ingredients = ingredients,
            Types = types.Select(type => new DishTypeAssignment { Type = type }).ToList()
        };

        context.Dishes.Add(dish);
        await context.SaveChangesAsync();

        var created = await LoadDish(dish.RecipeId);
        return CreatedAtAction(nameof(GetDish), new { id = dish.RecipeId }, ToDto(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateDish(int id, DishRequest request)
    {
        var dish = await context.Dishes
            .Include(dish => dish.Ingredients)
            .Include(dish => dish.Types)
            .FirstOrDefaultAsync(dish => dish.RecipeId == id);

        if (dish is null)
        {
            return NotFound();
        }

        var types = NormalizeTypes(request.Types);
        if (types.Count == 0)
        {
            return BadRequest("At least one dish type is required.");
        }

        var ingredients = await GetIngredients(request.IngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(request.IngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        dish.Name = request.Name;
        dish.ImageUrl = request.ImageUrl;
        dish.Description = request.Description;
        dish.Instructions = request.Instructions;
        dish.Cuisine = request.Cuisine;
        dish.Ingredients = ingredients;
        context.DishTypeAssignments.RemoveRange(dish.Types);
        dish.Types = types.Select(type => new DishTypeAssignment
        {
            DishId = dish.RecipeId,
            Type = type
        }).ToList();

        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteDish(int id)
    {
        var dish = await context.Dishes.FindAsync(id);
        if (dish is null)
        {
            return NotFound();
        }

        context.Dishes.Remove(dish);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private Task<Dish?> LoadDish(int id) => context.Dishes
        .AsNoTracking()
        .Include(dish => dish.Ingredients)
        .Include(dish => dish.Types)
        .FirstOrDefaultAsync(dish => dish.RecipeId == id);

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

    private static DishDto ToDto(Dish dish) => new(
        dish.RecipeId,
        RecipeType.Dish,
        dish.Name,
        dish.ImageUrl,
        dish.Description,
        dish.Instructions,
        dish.Ingredients.Select(ToDto).ToList(),
        dish.Types.Select(dishType => dishType.Type).OrderBy(type => type).ToList(),
        dish.Cuisine
    );

    private static List<DishType> NormalizeTypes(IReadOnlyCollection<DishType>? types) =>
        types is null
            ? []
            : types
                .Where(type => Enum.IsDefined(type))
                .Distinct()
                .ToList();

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
