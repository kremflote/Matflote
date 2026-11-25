// MATFLOTE: API controller for the assistant surface: a compact, name-based API for AI agents and scripts.
// Note: GET /api/assistant returns the usage guide itself, so an agent only needs the base URL to get started.

using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/assistant")]
public class AssistantController(AssistantService assistantService, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetGuide(CancellationToken cancellationToken)
    {
        var guidePath = Path.Combine(environment.ContentRootPath, "Docs", "assistant-api.md");
        if (!System.IO.File.Exists(guidePath))
        {
            return NotFound("The assistant API guide is missing from this build.");
        }

        return Content(
            await System.IO.File.ReadAllTextAsync(guidePath, cancellationToken),
            "text/markdown; charset=utf-8");
    }

    [HttpGet("context")]
    public async Task<ActionResult<AssistantContextDto>> GetContext(
        [FromQuery] int? historyDays,
        CancellationToken cancellationToken
    ) =>
        Ok(await assistantService.GetContextAsync(historyDays, cancellationToken));

    [HttpGet("recipes/{id:int}")]
    public async Task<ActionResult<AssistantRecipeDocumentDto>> GetRecipe(int id, CancellationToken cancellationToken)
    {
        var recipe = await assistantService.GetRecipeAsync(id, cancellationToken);
        return recipe is null ? NotFound($"No recipe has id {id}.") : Ok(recipe);
    }

    [HttpPost("recipes")]
    public async Task<ActionResult<AssistantImportResultDto>> ImportRecipes(
        AssistantImportRequest request,
        CancellationToken cancellationToken
    )
    {
        var result = await assistantService.ImportAsync(request, cancellationToken);
        return HasErrors(result.Errors, result.Ingredients.Concat(result.Recipes).Select(item => item.Errors))
            ? UnprocessableEntity(result)
            : Ok(result);
    }

    [HttpGet("meal-plan")]
    public async Task<ActionResult<AssistantMealPlanDto>> GetMealPlan(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken
    )
    {
        if (from is not null && to is not null && from > to)
        {
            return BadRequest("'from' must be before or equal to 'to'.");
        }

        return Ok(await assistantService.GetMealPlanAsync(from, to, cancellationToken));
    }

    [HttpPut("meal-plan")]
    public async Task<ActionResult<AssistantMealPlanResultDto>> SetMealPlan(
        AssistantMealPlanRequest request,
        CancellationToken cancellationToken
    )
    {
        var result = await assistantService.SetMealPlanAsync(request, cancellationToken);
        return HasErrors(result.Errors, result.Entries.Select(entry => entry.Errors))
            ? UnprocessableEntity(result)
            : Ok(result);
    }

    private static bool HasErrors(IReadOnlyCollection<string> requestErrors, IEnumerable<IReadOnlyCollection<string>> itemErrors) =>
        requestErrors.Count > 0 || itemErrors.Any(errors => errors.Count > 0);
}
