using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/ingredient-price-points")]
public class IngredientPricePointsController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IngredientPricePointDto>>> GetPricePoints(
        [FromQuery] int? ingredientId
    )
    {
        var query = context.IngredientPricePoints
            .AsNoTracking()
            .Include(pricePoint => pricePoint.Ingredient)
            .Include(pricePoint => pricePoint.Store)
            .AsQueryable();

        if (ingredientId is not null)
        {
            query = query.Where(pricePoint => pricePoint.IngredientId == ingredientId);
        }

        var pricePoints = await query
            .OrderByDescending(pricePoint => pricePoint.Date)
            .ThenByDescending(pricePoint => pricePoint.IngredientPricePointId)
            .ToListAsync();

        return Ok(pricePoints.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<IngredientPricePointDto>> CreatePricePoint(
        IngredientPricePointRequest request
    )
    {
        var ingredient = await context.Ingredients.FindAsync(request.IngredientId);
        if (ingredient is null)
        {
            return BadRequest("No ingredient found with that ID.");
        }

        var store = await context.Stores.FindAsync(request.StoreId);
        if (store is null)
        {
            return BadRequest("No store found with that ID.");
        }

        var pricePoint = new IngredientPricePoint
        {
            Ingredient = ingredient,
            Store = store,
            Price = request.Price,
            Date = request.Date,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        context.IngredientPricePoints.Add(pricePoint);
        await context.SaveChangesAsync();

        await context.Entry(pricePoint).Reference(current => current.Store).LoadAsync();
        await context.Entry(pricePoint).Reference(current => current.Ingredient).LoadAsync();

        return CreatedAtAction(nameof(GetPricePoints), new { ingredientId = pricePoint.IngredientId }, ToDto(pricePoint));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePricePoint(int id)
    {
        var pricePoint = await context.IngredientPricePoints.FindAsync(id);
        if (pricePoint is null)
        {
            return NotFound();
        }

        context.IngredientPricePoints.Remove(pricePoint);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static IngredientPricePointDto ToDto(IngredientPricePoint pricePoint) => new(
        pricePoint.IngredientPricePointId,
        pricePoint.IngredientId,
        pricePoint.Ingredient.IngredientName,
        new StoreDto(pricePoint.Store.StoreId, pricePoint.Store.Name),
        pricePoint.Price,
        pricePoint.Date,
        pricePoint.Note
    );
}
