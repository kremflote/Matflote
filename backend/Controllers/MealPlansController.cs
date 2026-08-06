// MATFLOTE: API controller for MealPlans-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MealPlansController(DinnerPlannerContext context) : ControllerBase
{
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
        if (!Enum.IsDefined(request.Slot))
        {
            return BadRequest("Unsupported meal slot.");
        }

        if (ContainsUnsupportedRecipeRole(request.Recipes))
        {
            return BadRequest("Unsupported meal recipe role.");
        }

        if (await EntryExists(request.Date, request.Slot))
        {
            return Conflict("A meal plan entry already exists for that date and slot.");
        }

        var missingRecipeIds = await GetMissingRecipeIds(request.Recipes);
        if (missingRecipeIds.Count > 0)
        {
            return BadRequest($"No recipes found for IDs: {string.Join(", ", missingRecipeIds)}.");
        }

        var missingIngredientIds = await GetMissingIngredientIds(request.Recipes);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var validationError = ValidateMealPlanItems(request.Recipes);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var entry = new MealPlanEntry
        {
            Date = request.Date,
            Slot = request.Slot,
            Notes = request.Notes,
            Recipes = ToModels(request.Recipes)
        };

        context.MealPlanEntries.Add(entry);
        await context.SaveChangesAsync();

        var created = await LoadEntry(entry.MealPlanEntryId);
        return CreatedAtAction(nameof(GetMealPlanEntry), new { id = entry.MealPlanEntryId }, ToDto(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateMealPlanEntry(int id, MealPlanEntryRequest request)
    {
        if (!Enum.IsDefined(request.Slot))
        {
            return BadRequest("Unsupported meal slot.");
        }

        if (ContainsUnsupportedRecipeRole(request.Recipes))
        {
            return BadRequest("Unsupported meal recipe role.");
        }

        var entry = await context.MealPlanEntries
            .Include(mealPlanEntry => mealPlanEntry.Recipes)
            .FirstOrDefaultAsync(mealPlanEntry => mealPlanEntry.MealPlanEntryId == id);

        if (entry is null)
        {
            return NotFound();
        }

        if (await EntryExists(request.Date, request.Slot, id))
        {
            return Conflict("A meal plan entry already exists for that date and slot.");
        }

        var missingRecipeIds = await GetMissingRecipeIds(request.Recipes);
        if (missingRecipeIds.Count > 0)
        {
            return BadRequest($"No recipes found for IDs: {string.Join(", ", missingRecipeIds)}.");
        }

        var missingIngredientIds = await GetMissingIngredientIds(request.Recipes);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var validationError = ValidateMealPlanItems(request.Recipes);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        entry.Date = request.Date;
        entry.Slot = request.Slot;
        entry.Notes = request.Notes;

        context.MealPlanRecipes.RemoveRange(entry.Recipes);
        entry.Recipes = ToModels(request.Recipes);

        await context.SaveChangesAsync();
        return NoContent();
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

    private async Task<List<int>> GetMissingRecipeIds(IReadOnlyCollection<MealPlanRecipeRequest> recipeRequests)
    {
        var requestedIds = recipeRequests
            .Where(recipe => recipe.RecipeId is not null)
            .Select(recipe => recipe.RecipeId!.Value)
            .Distinct()
            .ToList();
        var existingIds = await context.Recipes
            .Where(recipe => requestedIds.Contains(recipe.RecipeId))
            .Select(recipe => recipe.RecipeId)
            .ToListAsync();

        return requestedIds.Except(existingIds).ToList();
    }

    private async Task<List<int>> GetMissingIngredientIds(IReadOnlyCollection<MealPlanRecipeRequest> recipeRequests)
    {
        var requestedIds = recipeRequests
            .Where(recipe => recipe.IngredientId is not null)
            .Select(recipe => recipe.IngredientId!.Value)
            .Distinct()
            .ToList();

        var existingIds = await context.Ingredients
            .Where(ingredient => requestedIds.Contains(ingredient.IngredientId))
            .Select(ingredient => ingredient.IngredientId)
            .ToListAsync();

        return requestedIds.Except(existingIds).ToList();
    }

    private static bool ContainsUnsupportedRecipeRole(IEnumerable<MealPlanRecipeRequest> recipes) =>
        recipes.Any(recipe => !Enum.IsDefined(recipe.Role));

    private static string? ValidateMealPlanItems(IEnumerable<MealPlanRecipeRequest> recipes)
    {
        foreach (var recipe in recipes)
        {
            var hasRecipe = recipe.RecipeId is not null;
            var hasIngredient = recipe.IngredientId is not null;
            if (hasRecipe == hasIngredient)
            {
                return "Each meal plan item must include either a recipe or an ingredient.";
            }

            if (hasRecipe && (recipe.Portions is null || recipe.Portions <= 0m))
            {
                return "Recipe meal plan items need a positive portion count.";
            }

            if (hasIngredient && (recipe.Amount is null || recipe.Amount <= 0m || recipe.Unit is null || !Enum.IsDefined(recipe.Unit.Value)))
            {
                return "Ingredient meal plan items need a positive amount and supported unit.";
            }
        }

        return null;
    }

    private static List<MealPlanRecipe> ToModels(IEnumerable<MealPlanRecipeRequest> recipes) =>
        recipes
            .OrderBy(recipe => recipe.SortOrder)
            .Select((recipe, index) => new MealPlanRecipe
            {
                RecipeId = recipe.RecipeId,
                IngredientId = recipe.IngredientId,
                Role = recipe.Role,
                SortOrder = recipe.SortOrder < 0 ? index : recipe.SortOrder,
                Portions = recipe.RecipeId is null ? null : recipe.Portions,
                Amount = recipe.IngredientId is null ? null : recipe.Amount,
                Unit = recipe.IngredientId is null ? null : recipe.Unit
            })
            .ToList();

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
