// MATFLOTE: API controller for Ingredients-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Filters;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IngredientsController(
    DinnerPlannerContext context,
    IngredientCatalogService ingredients,
    IngredientUsageService ingredientUsage) : ControllerBase
{
    [HttpGet]
    [CatalogETag(CatalogGroup.Ingredients)]
    public async Task<ActionResult<IEnumerable<IngredientDto>>> GetIngredients() =>
        Ok(await ingredients.ListAsync(HttpContext.RequestAborted));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<IngredientDto>> GetIngredient(int id) =>
        await ingredients.GetAsync(id, HttpContext.RequestAborted) is { } ingredient ? Ok(ingredient) : NotFound();

    [HttpPost]
    public async Task<ActionResult<IngredientDto>> CreateIngredient(IngredientRequest request)
    {
        var cancellationToken = HttpContext.RequestAborted;
        if (await ingredients.FindNameClashAsync(request.IngredientName, request.BrandId, exceptId: null, cancellationToken) is { } clash)
        {
            return Conflict(new ApiErrorDto(clash));
        }

        var (problems, knownTags) = await ingredients.ValidateAsync(request, cancellationToken);
        if (problems.Count > 0)
        {
            return BadRequest(ApiErrorDto.From(problems));
        }

        var ingredient = new Ingredient();
        ingredients.Apply(ingredient, request, knownTags);
        context.Ingredients.Add(ingredient);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetIngredient), new { id = ingredient.IngredientId }, await ingredients.GetAsync(ingredient.IngredientId, cancellationToken));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<IngredientDto>> UpdateIngredient(int id, IngredientRequest request)
    {
        var cancellationToken = HttpContext.RequestAborted;
        var ingredient = await context.Ingredients
            .Include(ingredient => ingredient.Tags)
            .FirstOrDefaultAsync(ingredient => ingredient.IngredientId == id, cancellationToken);
        if (ingredient is null)
        {
            return NotFound();
        }

        // Only a change of name or brand can clash; an ingredient that already shares both with another one
        // (possible in data from before this check) can still be saved.
        if (IngredientCatalogService.ChangesNameOrBrand(ingredient, request)
            && await ingredients.FindNameClashAsync(request.IngredientName, request.BrandId, exceptId: id, cancellationToken) is { } clash)
        {
            return Conflict(new ApiErrorDto(clash));
        }

        var (problems, knownTags) = await ingredients.ValidateAsync(request, cancellationToken);
        if (problems.Count > 0)
        {
            return BadRequest(ApiErrorDto.From(problems));
        }

        ingredients.Apply(ingredient, request, knownTags);
        await context.SaveChangesAsync(cancellationToken);

        return Ok(await ingredients.GetAsync(ingredient.IngredientId, cancellationToken));
    }

    /// <summary>Deletes an unused ingredient. One that recipes or planned meals use is refused with 409 and the list of uses.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteIngredient(int id)
    {
        var ingredient = await context.Ingredients.FindAsync(id);
        if (ingredient is null)
        {
            return NotFound();
        }

        var uses = await ingredientUsage.FindUsesAsync(id, ingredient.IngredientName, HttpContext.RequestAborted);
        if (uses.Recipes.Count > 0 || uses.MealPlanEntries.Count > 0)
        {
            return Conflict(uses);
        }

        context.Ingredients.Remove(ingredient);
        await context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Moves every recipe line and planned item from this ingredient to another one, then deletes this one.
    /// A recipe that has both keeps one line with the amounts added together.
    /// </summary>
    [HttpPost("{id:int}/replace-with/{otherId:int}")]
    public async Task<ActionResult<IngredientReplacementResultDto>> ReplaceWith(int id, int otherId)
    {
        if (id == otherId)
        {
            return BadRequest(new ApiErrorDto("An ingredient cannot replace itself."));
        }

        var source = await context.Ingredients.FindAsync(id);
        var target = await context.Ingredients.FindAsync(otherId);
        if (source is null || target is null)
        {
            return NotFound(new ApiErrorDto($"No ingredient has id {(source is null ? id : otherId)}."));
        }

        var (problems, moved, merged, mealItems) = await ingredientUsage.StageReplacementAsync(source, target, HttpContext.RequestAborted);
        if (problems.Count > 0)
        {
            return Conflict(ApiErrorDto.From(problems));
        }

        await context.SaveChangesAsync();

        return Ok(new IngredientReplacementResultDto(
            id,
            (await ingredients.GetAsync(otherId, HttpContext.RequestAborted))!,
            moved,
            merged,
            mealItems));
    }
}
