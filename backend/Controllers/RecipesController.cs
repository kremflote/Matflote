// MATFLOTE: API controller for Recipes-related frontend and integration requests.
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
public class RecipesController(
    DinnerPlannerContext context,
    RecipeCatalogService recipes,
    RecipePdfService recipePdfService) : ControllerBase
{
    [HttpGet]
    [CatalogETag(CatalogGroup.Recipes)]
    public async Task<ActionResult<IEnumerable<RecipeDto>>> GetRecipes() =>
        Ok(await recipes.ListAsync(HttpContext.RequestAborted));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecipeDto>> GetRecipe(int id) =>
        await recipes.GetAsync(id, HttpContext.RequestAborted) is { } recipe ? Ok(recipe) : NotFound();

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> ExportRecipePdf(int id, [FromQuery] string? language)
    {
        var pdf = await recipePdfService.CreateRecipePdfAsync(id, language, HttpContext.RequestAborted);

        return pdf is null
            ? NotFound()
            : File(pdf.Content, "application/pdf", pdf.FileName);
    }

    [HttpPost]
    public async Task<ActionResult<RecipeDto>> CreateRecipe(RecipeRequest request)
    {
        var cancellationToken = HttpContext.RequestAborted;
        if (await recipes.FindNameClashAsync(request.Name, exceptId: null, cancellationToken) is { } clash)
        {
            return Conflict(new ApiErrorDto(clash));
        }

        var validation = await recipes.ValidateAsync(request, recipeId: null, cancellationToken);
        if (validation.Problems.Count > 0)
        {
            return BadRequest(ApiErrorDto.From(validation.Problems));
        }

        var recipe = new Recipe();
        recipes.Apply(recipe, request, validation);
        context.Recipes.Add(recipe);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.RecipeId }, await recipes.GetAsync(recipe.RecipeId, cancellationToken));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RecipeDto>> UpdateRecipe(int id, RecipeRequest request)
    {
        var cancellationToken = HttpContext.RequestAborted;
        var recipe = await recipes.Details()
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id, cancellationToken);

        if (recipe is null)
        {
            return NotFound();
        }

        // Renaming onto another recipe's name is refused; saving a recipe that already shares a name with another
        // (possible in data from before this check) without renaming it is allowed.
        if (CatalogNames.Key(request.Name) != CatalogNames.Key(recipe.Name)
            && await recipes.FindNameClashAsync(request.Name, exceptId: recipe.RecipeId, cancellationToken) is { } clash)
        {
            return Conflict(new ApiErrorDto(clash));
        }

        var validation = await recipes.ValidateAsync(request, recipe.RecipeId, cancellationToken);
        if (validation.Problems.Count > 0)
        {
            return BadRequest(ApiErrorDto.From(validation.Problems));
        }

        if (await recipes.WouldCreateComponentCycleAsync(recipe.RecipeId, validation.Components.Select(component => component.RecipeId), cancellationToken))
        {
            return BadRequest(new ApiErrorDto(RecipeCatalogService.ComponentCycleMessage));
        }

        recipes.Apply(recipe, request, validation);
        await context.SaveChangesAsync(cancellationToken);

        return Ok(await recipes.GetAsync(recipe.RecipeId, cancellationToken));
    }

    /// <summary>The household's rating, kept apart from the recipe edit so saving the recipe form never touches it.</summary>
    [HttpPut("{id:int}/rating")]
    public async Task<ActionResult<RecipeDto>> SetRating(int id, RecipeRatingRequest request)
    {
        if (RecipeCatalogService.ValidateRating(request) is { } error)
        {
            return BadRequest(error);
        }

        var recipe = await context.Recipes.FindAsync(id);
        if (recipe is null)
        {
            return NotFound();
        }

        RecipeCatalogService.ApplyRating(recipe, request);
        await context.SaveChangesAsync();

        return Ok(await recipes.GetAsync(id, HttpContext.RequestAborted));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRecipe(int id)
    {
        var recipe = await context.Recipes.FindAsync(id);
        if (recipe is null)
        {
            return NotFound();
        }

        await recipes.StageDeleteAsync(recipe, HttpContext.RequestAborted);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
