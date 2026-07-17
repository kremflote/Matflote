using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CuisinesController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CuisineDto>>> GetCuisines()
    {
        var cuisines = await context.Cuisines
            .AsNoTracking()
            .OrderBy(cuisine => cuisine.Name)
            .ToListAsync();

        return Ok(cuisines.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<CuisineDto>> CreateCuisine(LookupRequest request)
    {
        var name = request.Name.Trim();
        var existingCuisine = await context.Cuisines
            .FirstOrDefaultAsync(cuisine => cuisine.Name.ToLower() == name.ToLower());

        if (existingCuisine is not null)
        {
            return Ok(ToDto(existingCuisine));
        }

        var possibleDuplicate = LookupDuplicateDetector.FindNearDuplicate(
            name,
            await context.Cuisines.AsNoTracking().Select(cuisine => cuisine.Name).ToListAsync()
        );
        if (possibleDuplicate is not null)
        {
            return Conflict($"Possible duplicate: {possibleDuplicate}.");
        }

        var cuisine = new Cuisine { Name = name };
        context.Cuisines.Add(cuisine);
        await context.SaveChangesAsync();

        return Ok(ToDto(cuisine));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCuisine(int id)
    {
        var cuisine = await context.Cuisines.FindAsync(id);
        if (cuisine is null)
        {
            return NotFound();
        }

        var dishes = await context.Dishes
            .Where(dish => dish.CuisineId == id)
            .ToListAsync();

        foreach (var dish in dishes)
        {
            dish.CuisineId = null;
        }

        context.Cuisines.Remove(cuisine);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static CuisineDto ToDto(Cuisine cuisine) => new(cuisine.CuisineId, cuisine.Name);
}
