// MATFLOTE: API controller for MealPlans-related frontend and integration requests.
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
public class MealPlansController(DinnerPlannerContext context, MealPlanWriter writer) : ControllerBase
{
    private const int MaxBatchRangeDays = 62;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MealPlanEntryDto>>> GetMealPlan(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to
    )
    {
        if (from > to)
        {
            return BadRequest("'from' must be before or equal to 'to'.");
        }

        var entries = await context.MealPlanEntries
            .AsNoTracking()
            .Include(entry => entry.Recipes)
                .ThenInclude(item => item.Ingredient)
            .Where(entry => entry.Date >= from && entry.Date <= to)
            .OrderBy(entry => entry.Date)
            .ThenBy(entry => entry.Slot)
            .ToListAsync();

        return Ok(entries.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MealPlanEntryDto>> GetMealPlanEntry(int id)
    {
        var entry = await context.MealPlanEntries
            .AsNoTracking()
            .Include(mealPlanEntry => mealPlanEntry.Recipes)
                .ThenInclude(item => item.Ingredient)
            .FirstOrDefaultAsync(mealPlanEntry => mealPlanEntry.MealPlanEntryId == id);

        return entry is null ? NotFound() : Ok(ToDto(entry));
    }

    [HttpPost]
    public async Task<ActionResult<MealPlanEntryDto>> CreateMealPlanEntry(MealPlanEntryRequest request)
    {
        // An entry without items would only occupy the slot (AUDIT B5).
        if (request.Recipes.Count == 0)
        {
            return BadRequest(new ApiErrorDto("A meal needs at least one recipe or ingredient in \"recipes\"."));
        }

        if (await EntryExists(request.Date, request.Slot))
        {
            return Conflict("A meal plan entry already exists for that date and slot.");
        }

        var validationError = await writer.ValidateAsync([request], HttpContext.RequestAborted);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var entry = writer.Upsert(null, request.Date, request.Slot, request.Notes, MealPlanWriter.ToModels(request.Recipes));
        await context.SaveChangesAsync();

        var created = await LoadEntry(entry.MealPlanEntryId);
        return CreatedAtAction(nameof(GetMealPlanEntry), new { id = entry.MealPlanEntryId }, ToDto(created!));
    }

    /// <summary>Replaces an entry. An entry with no items is deleted and the answer is 204 No Content.</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<MealPlanEntryDto>> UpdateMealPlanEntry(int id, MealPlanEntryRequest request)
    {
        var entry = await context.MealPlanEntries
            .Include(mealPlanEntry => mealPlanEntry.Recipes)
            .FirstOrDefaultAsync(mealPlanEntry => mealPlanEntry.MealPlanEntryId == id);

        if (entry is null)
        {
            return NotFound();
        }

        if (request.Recipes.Count == 0)
        {
            writer.Remove(entry);
            await context.SaveChangesAsync();
            return NoContent();
        }

        if (await EntryExists(request.Date, request.Slot, id))
        {
            return Conflict("A meal plan entry already exists for that date and slot.");
        }

        var validationError = await writer.ValidateAsync([request], HttpContext.RequestAborted);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        writer.Upsert(entry, request.Date, request.Slot, request.Notes, MealPlanWriter.ToModels(request.Recipes));
        await context.SaveChangesAsync();

        var updated = await LoadEntry(entry.MealPlanEntryId);
        return Ok(ToDto(updated!));
    }

    /// <summary>
    /// Several meal plan changes in one transaction: entries to delete by id, an optional range to clear,
    /// and entries to write by date and slot (an entry without items empties its slot). Either everything
    /// is applied or, on any error, nothing. Returns every entry in the range the request touched.
    /// </summary>
    [HttpPut("batch")]
    public async Task<ActionResult<MealPlanBatchResultDto>> ApplyBatch(MealPlanBatchRequest request)
    {
        var upserts = request.Upsert ?? [];
        var deleteIds = (request.Delete ?? []).Distinct().ToList();

        if (upserts.Count == 0 && deleteIds.Count == 0 && request.ClearRange is null)
        {
            return BadRequest("Nothing to do: provide \"upsert\", \"delete\" and/or \"clearRange\".");
        }

        if (request.ClearRange is { } clearRange)
        {
            if (clearRange.From > clearRange.To)
            {
                return BadRequest("clearRange.from must be on or before clearRange.to.");
            }

            if (clearRange.To.DayNumber - clearRange.From.DayNumber >= MaxBatchRangeDays)
            {
                return BadRequest($"clearRange can span at most {MaxBatchRangeDays} days.");
            }
        }

        var duplicateSlot = upserts
            .GroupBy(entry => (entry.Date, entry.Slot))
            .FirstOrDefault(group => group.Count() > 1);
        if (duplicateSlot is not null)
        {
            return BadRequest($"{duplicateSlot.Key.Date:yyyy-MM-dd} {duplicateSlot.Key.Slot} appears more than once in \"upsert\".");
        }

        var validationError = await writer.ValidateAsync(upserts, HttpContext.RequestAborted);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var deleteDates = await context.MealPlanEntries
            .Where(entry => deleteIds.Contains(entry.MealPlanEntryId))
            .Select(entry => new { entry.MealPlanEntryId, entry.Date })
            .ToListAsync(HttpContext.RequestAborted);
        var missingDeleteIds = deleteIds.Except(deleteDates.Select(entry => entry.MealPlanEntryId)).ToList();
        if (missingDeleteIds.Count > 0)
        {
            return BadRequest($"No meal plan entries found for IDs: {string.Join(", ", missingDeleteIds)}.");
        }

        var dates = upserts.Select(entry => entry.Date)
            .Concat(deleteDates.Select(entry => entry.Date))
            .ToList();
        if (request.ClearRange is not null)
        {
            dates.Add(request.ClearRange.From);
            dates.Add(request.ClearRange.To);
        }

        var from = dates.Min();
        var to = dates.Max();
        if (to.DayNumber - from.DayNumber >= MaxBatchRangeDays)
        {
            return BadRequest($"A batch can touch at most {MaxBatchRangeDays} days.");
        }

        var stored = await writer.LoadRangeAsync(from, to, HttpContext.RequestAborted);
        var storedBySlot = stored.ToDictionary(entry => (entry.Date, entry.Slot));
        var upsertSlots = upserts.Select(entry => (entry.Date, entry.Slot)).ToHashSet();
        var toRemove = stored
            .Where(entry => deleteIds.Contains(entry.MealPlanEntryId))
            .ToHashSet();
        if (request.ClearRange is not null)
        {
            toRemove.UnionWith(stored.Where(entry =>
                entry.Date >= request.ClearRange.From &&
                entry.Date <= request.ClearRange.To &&
                !upsertSlots.Contains((entry.Date, entry.Slot))));
        }

        foreach (var upsert in upserts)
        {
            storedBySlot.TryGetValue((upsert.Date, upsert.Slot), out var existing);
            if (upsert.Recipes.Count == 0)
            {
                if (existing is not null)
                {
                    toRemove.Add(existing);
                }

                continue;
            }

            // A slot that is deleted and written in the same request keeps its row and gets the new items.
            if (existing is not null)
            {
                toRemove.Remove(existing);
            }

            writer.Upsert(existing, upsert.Date, upsert.Slot, upsert.Notes, MealPlanWriter.ToModels(upsert.Recipes));
        }

        foreach (var entry in toRemove)
        {
            writer.Remove(entry);
        }

        await context.SaveChangesAsync(HttpContext.RequestAborted);

        var entries = await context.MealPlanEntries
            .AsNoTracking()
            .Include(entry => entry.Recipes)
            .Where(entry => entry.Date >= from && entry.Date <= to)
            .OrderBy(entry => entry.Date)
            .ThenBy(entry => entry.Slot)
            .ToListAsync(HttpContext.RequestAborted);

        return Ok(new MealPlanBatchResultDto(from, to, entries.Select(ToDto).ToList()));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteMealPlanEntry(int id)
    {
        var entry = await context.MealPlanEntries.FindAsync(id);
        if (entry is null)
        {
            return NotFound();
        }

        context.MealPlanEntries.Remove(entry);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private Task<MealPlanEntry?> LoadEntry(int id) => context.MealPlanEntries
        .AsNoTracking()
        .Include(entry => entry.Recipes)
            .ThenInclude(item => item.Ingredient)
        .FirstOrDefaultAsync(entry => entry.MealPlanEntryId == id);

    private Task<bool> EntryExists(DateOnly date, MealSlot slot, int? ignoredEntryId = null) =>
        context.MealPlanEntries.AnyAsync(entry =>
            entry.Date == date &&
            entry.Slot == slot &&
            (ignoredEntryId == null || entry.MealPlanEntryId != ignoredEntryId));

    private static MealPlanEntryDto ToDto(MealPlanEntry entry) => new(
        entry.MealPlanEntryId,
        entry.Date,
        entry.Slot,
        entry.Notes,
        entry.Recipes
            .OrderBy(recipe => recipe.SortOrder)
            .Select(ToDto)
            .ToList()
    );

    private static MealPlanRecipeDto ToDto(MealPlanRecipe recipe) => new(
        recipe.MealPlanRecipeId,
        recipe.RecipeId,
        recipe.IngredientId,
        recipe.Role,
        recipe.SortOrder,
        recipe.Portions,
        recipe.Amount,
        recipe.Unit
    );
}
