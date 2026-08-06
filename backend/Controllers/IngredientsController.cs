// MATFLOTE: API controller for Ingredients-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IngredientsController(DinnerPlannerContext context, TagCatalogService tagCatalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IngredientDto>>> GetIngredients()
    {
        var ingredients = await context.Ingredients
            .AsNoTracking()
            .Include(ingredient => ingredient.Brand)
            .Include(ingredient => ingredient.Tags)
                .ThenInclude(tag => tag.TagDefinition)
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
                .ThenInclude(tag => tag.TagDefinition)
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

        var knownTags = await tagCatalog.NormalizeKnownTagDefinitionsAsync(request.Tags, HttpContext.RequestAborted);
        var ingredient = new Ingredient
        {
            IngredientName = request.IngredientName,
            Description = request.Description,
            BrandId = request.BrandId,
            ImageUrl = request.ImageUrl,
            Price = request.Price,
            Tags = knownTags
                .Select(tag => new IngredientTagAssignment
                {
                    IngredientTagDefinitionId = tag.IngredientTagDefinitionId
                })
                .ToList(),
            NutritionPer100 = request.NutritionPer100,
            NutritionSource = NormalizeNutritionSource(request.NutritionPer100, request.NutritionSource),
            NutritionSourceLabel = request.NutritionSourceLabel,
            MatvaretabellenFoodId = request.MatvaretabellenFoodId,
            NutritionMatchedName = request.NutritionMatchedName,
            NutritionMatchConfidence = request.NutritionMatchConfidence,
            Color = request.Color
        };

        context.Ingredients.Add(ingredient);
        await context.SaveChangesAsync();

        var created = await LoadIngredient(ingredient.IngredientId);
        return CreatedAtAction(nameof(GetIngredient), new { id = ingredient.IngredientId }, ToDto(created!));
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
        ingredient.ImageUrl = request.ImageUrl;
        ingredient.Price = request.Price;
        var knownTags = await tagCatalog.NormalizeKnownTagDefinitionsAsync(request.Tags, HttpContext.RequestAborted);
        context.IngredientTagAssignments.RemoveRange(ingredient.Tags);
        ingredient.Tags = knownTags
            .Select(tag => new IngredientTagAssignment
            {
                IngredientId = ingredient.IngredientId,
                IngredientTagDefinitionId = tag.IngredientTagDefinitionId
            })
            .ToList();
        ingredient.NutritionPer100 = request.NutritionPer100;
        ingredient.NutritionSource = NormalizeNutritionSource(request.NutritionPer100, request.NutritionSource);
        ingredient.NutritionSourceLabel = request.NutritionSourceLabel;
        ingredient.MatvaretabellenFoodId = request.MatvaretabellenFoodId;
        ingredient.NutritionMatchedName = request.NutritionMatchedName;
        ingredient.NutritionMatchConfidence = request.NutritionMatchConfidence;
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

    private Task<Ingredient?> LoadIngredient(int id) =>
        context.Ingredients
            .AsNoTracking()
            .Include(ingredient => ingredient.Brand)
            .Include(ingredient => ingredient.Tags)
                .ThenInclude(tag => tag.TagDefinition)
            .FirstOrDefaultAsync(ingredient => ingredient.IngredientId == id);

    private static NutritionDataSource NormalizeNutritionSource(NutritionFacts? nutrition, NutritionDataSource? source) =>
        nutrition is null ? NutritionDataSource.None : source ?? NutritionDataSource.Manual;

    private static IngredientDto ToDto(Ingredient ingredient) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Description,
        ingredient.BrandId,
        ingredient.Brand is null ? null : new BrandDto(ingredient.Brand.BrandId, ingredient.Brand.Name),
        ingredient.ImageUrl,
        ingredient.Price,
        ingredient.Tags.Select(ingredientTag => ingredientTag.TagDefinition.Name).OrderBy(tag => tag).ToList(),
        ingredient.NutritionPer100,
        ingredient.NutritionSource,
        ingredient.NutritionSourceLabel,
        ingredient.MatvaretabellenFoodId,
        ingredient.NutritionMatchedName,
        ingredient.NutritionMatchConfidence,
        ingredient.Color
    );
}
