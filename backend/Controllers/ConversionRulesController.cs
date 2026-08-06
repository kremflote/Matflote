// MATFLOTE: API controller for ConversionRules-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/conversion-rules")]
public class ConversionRulesController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ConversionRuleDto>>> GetRules()
    {
        var rules = await context.ConversionRules
            .AsNoTracking()
            .OrderBy(rule => rule.SortOrder)
            .ThenBy(rule => rule.FromText)
            .ToListAsync();

        return Ok(rules.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<ConversionRuleDto>> CreateRule(ConversionRuleRequest request)
    {
        var fromText = request.FromText.Trim();
        var toText = request.ToText.Trim();

        var existingRule = await context.ConversionRules
            .AsNoTracking()
            .FirstOrDefaultAsync(rule =>
                rule.FromText.ToLower() == fromText.ToLower() &&
                rule.ToText.ToLower() == toText.ToLower());
        if (existingRule is not null)
        {
            return Ok(ToDto(existingRule));
        }

        var nextSortOrder = await context.ConversionRules
            .Select(rule => (int?)rule.SortOrder)
            .MaxAsync() ?? 0;

        var rule = new ConversionRule
        {
            FromText = fromText,
            ToText = toText,
            FromTextNb = fromText,
            ToTextNb = toText,
            SortOrder = nextSortOrder + 100
        };

        context.ConversionRules.Add(rule);
        await context.SaveChangesAsync();

        return Ok(ToDto(rule));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRule(int id)
    {
        var rule = await context.ConversionRules.FindAsync(id);
        if (rule is null)
        {
            return NotFound();
        }

        context.ConversionRules.Remove(rule);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static ConversionRuleDto ToDto(ConversionRule rule) => new(
        rule.ConversionRuleId,
        rule.FromText,
        rule.ToText,
        rule.FromTextNb,
        rule.ToTextNb,
        rule.SortOrder
    );
}
