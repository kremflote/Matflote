using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DessertsController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DessertDto>>> GetDesserts()
    {
        var desserts = await context.Desserts
            .AsNoTracking()
            .Include(dessert => dessert.Ingredients)
            .OrderBy(dessert => dessert.Name)
            .ToListAsync();

        return Ok(desserts.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DessertDto>> GetDessert(int id)
    {
        var dessert = await context.Desserts
            .AsNoTracking()
            .Include(dessert => dessert.Ingredients)
            .FirstOrDefaultAsync(dessert => dessert.RecipeId == id);

        return dessert is null ? NotFound() : Ok(ToDto(dessert));
    }

    [HttpPost]
    public async Task<ActionResult<DessertDto>> CreateDessert(DessertRequest request)
    {
        var ingredients = await GetIngredients(request.IngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(request.IngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var dessert = new Dessert
        {
            Name = request.Name,
            ImageUrl = request.ImageUrl,
            Description = request.Description,
            Instructions = request.Instructions,
            Ingredients = ingredients,
            Type = request.Type
        };

        context.Desserts.Add(dessert);
        await context.SaveChangesAsync();

        var created = await LoadDessert(dessert.RecipeId);
        return CreatedAtAction(nameof(GetDessert), new { id = dessert.RecipeId }, ToDto(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateDessert(int id, DessertRequest request)
    {
        var dessert = await context.Desserts
            .Include(dessert => dessert.Ingredients)
            .FirstOrDefaultAsync(dessert => dessert.RecipeId == id);

        if (dessert is null)
        {
            return NotFound();
        }

        var ingredients = await GetIngredients(request.IngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(request.IngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        dessert.Name = request.Name;
        dessert.ImageUrl = request.ImageUrl;
        dessert.Description = request.Description;
        dessert.Instructions = request.Instructions;
        dessert.Ingredients = ingredients;
        dessert.Type = request.Type;

        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteDessert(int id)
    {
        var dessert = await context.Desserts.FindAsync(id);
        if (dessert is null)
        {
            return NotFound();
        }

        context.Desserts.Remove(dessert);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private Task<Dessert?> LoadDessert(int id) => context.Desserts
        .AsNoTracking()
        .Include(dessert => dessert.Ingredients)
        .FirstOrDefaultAsync(dessert => dessert.RecipeId == id);

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

    private static DessertDto ToDto(Dessert dessert) => new(
        dessert.RecipeId,
        RecipeType.Dessert,
        dessert.Name,
        dessert.ImageUrl,
        dessert.Description,
        dessert.Instructions,
        dessert.Ingredients.Select(ToDto).ToList(),
        dessert.Type
    );

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
