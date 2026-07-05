using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IngredientsController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IngredientDto>>> GetIngredients()
    {
        var ingredients = await context.Ingredients
            .AsNoTracking()
            .Include(ingredient => ingredient.Brand)
            .Include(ingredient => ingredient.Tags)
            .OrderBy(ingredient => ingredient.IngredientName)
            .ToListAsync();

        return Ok(ingredients.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<IngredientDto>> GetIngredient(int id)
    {
        var ingredient = await context.Ingredients
            .AsNoTracking()
            .Include(ingredient => ingredient.Brand)
            .Include(ingredient => ingredient.Tags)
            .FirstOrDefaultAsync(ingredient => ingredient.IngredientId == id);

        return ingredient is null ? NotFound() : Ok(ToDto(ingredient));
    }

    [HttpPost]
    public async Task<ActionResult<IngredientDto>> CreateIngredient(IngredientRequest request)
    {
        if (!await BrandExists(request.BrandId))
        {
            return BadRequest("No brand found with that ID.");
        }

        var ingredient = new Ingredient
        {
            IngredientName = request.IngredientName,
            Description = request.Description,
            BrandId = request.BrandId,
            Price = request.Price,
            Tags = NormalizeTags(request.Tags)
                .Select(tag => new IngredientTagAssignment { Tag = tag })
                .ToList(),
            NutritionPer100 = request.NutritionPer100,
            Color = request.Color
        };

        context.Ingredients.Add(ingredient);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetIngredient), new { id = ingredient.IngredientId }, ToDto(ingredient));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateIngredient(int id, IngredientRequest request)
    {
        var ingredient = await context.Ingredients
            .Include(ingredient => ingredient.Tags)
            .FirstOrDefaultAsync(ingredient => ingredient.IngredientId == id);
        if (ingredient is null)
        {
            return NotFound();
        }

        if (!await BrandExists(request.BrandId))
        {
            return BadRequest("No brand found with that ID.");
        }

        ingredient.IngredientName = request.IngredientName;
        ingredient.Description = request.Description;
        ingredient.BrandId = request.BrandId;
        ingredient.Price = request.Price;
        context.IngredientTagAssignments.RemoveRange(ingredient.Tags);
        ingredient.Tags = NormalizeTags(request.Tags)
            .Select(tag => new IngredientTagAssignment
            {
                IngredientId = ingredient.IngredientId,
                Tag = tag
            })
            .ToList();
        ingredient.NutritionPer100 = request.NutritionPer100;
        ingredient.Color = request.Color;

        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteIngredient(int id)
    {
        var ingredient = await context.Ingredients.FindAsync(id);
        if (ingredient is null)
        {
            return NotFound();
        }

        var recipeIngredients = await context.RecipeIngredients
            .Where(recipeIngredient => recipeIngredient.IngredientId == id)
            .ToListAsync();

        context.RecipeIngredients.RemoveRange(recipeIngredients);
        context.Ingredients.Remove(ingredient);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> BrandExists(int? brandId) =>
        brandId is null || await context.Brands.AnyAsync(brand => brand.BrandId == brandId);

    private static List<IngredientTag> NormalizeTags(IReadOnlyCollection<IngredientTag>? tags) =>
        tags is null
            ? []
            : tags
                .Where(tag => Enum.IsDefined(tag))
                .Distinct()
                .ToList();

    private static IngredientDto ToDto(Ingredient ingredient) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Description,
        ingredient.BrandId,
        ingredient.Brand is null ? null : new BrandDto(ingredient.Brand.BrandId, ingredient.Brand.Name),
        ingredient.Price,
        ingredient.Tags.Select(ingredientTag => ingredientTag.Tag).OrderBy(tag => tag).ToList(),
        ingredient.NutritionPer100,
        ingredient.Color
    );
}
