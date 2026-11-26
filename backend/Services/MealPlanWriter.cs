// MATFLOTE: Shared validation and write steps for meal plan entries.
// Note: Used by the id-based endpoints in MealPlansController (single entries and the batch) and by the
// name-based assistant API, so all of them store an entry the same way. Nothing here calls SaveChanges:
// callers stage every change first and save once, which makes a multi-entry write atomic.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class MealPlanWriter(DinnerPlannerContext context)
{
    /// <summary>How many days one batch request may touch, so a mistake cannot rewrite a whole year.</summary>
    public const int MaxBatchRangeDays = 62;

    /// <summary>The entries of a date range, tracked and with their items, ready to change.</summary>
    public Task<List<MealPlanEntry>> LoadRangeAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken = default) =>
        context.MealPlanEntries
            .Include(entry => entry.Recipes)
            .Where(entry => entry.Date >= from && entry.Date <= to)
            .ToListAsync(cancellationToken);

    /// <summary>Gives a slot exactly these items, reusing the stored entry when there is one.</summary>
    public MealPlanEntry Upsert(MealPlanEntry? stored, DateOnly date, MealSlot slot, string? notes, IEnumerable<MealPlanRecipe> items)
    {
        var entry = stored;
        if (entry is null)
        {
            entry = new MealPlanEntry { Date = date, Slot = slot };
            context.MealPlanEntries.Add(entry);
        }
        else
        {
            context.MealPlanRecipes.RemoveRange(entry.Recipes);
            entry.Recipes.Clear();
            entry.Date = date;
            entry.Slot = slot;
        }

        entry.Notes = notes;
        foreach (var item in items)
        {
            entry.Recipes.Add(item);
        }

        return entry;
    }

    public void Remove(MealPlanEntry stored) => context.MealPlanEntries.Remove(stored);

    /// <summary>
    /// Checks the id-based entry requests: slot, roles, item shape and that every recipe and ingredient exists.
    /// Returns the first problem found, or null.
    /// </summary>
    public async Task<string?> ValidateAsync(IReadOnlyCollection<MealPlanEntryRequest> entries, CancellationToken cancellationToken = default)
    {
        if (entries.Any(entry => !Enum.IsDefined(entry.Slot)))
        {
            return "Unsupported meal slot.";
        }

        var items = entries.SelectMany(entry => entry.Recipes).ToList();
        if (items.Any(item => !Enum.IsDefined(item.Role)))
        {
            return "Unsupported meal recipe role.";
        }

        var recipeIds = items.Where(item => item.RecipeId is not null).Select(item => item.RecipeId!.Value).Distinct().ToList();
        var existingRecipeIds = await context.Recipes
            .Where(recipe => recipeIds.Contains(recipe.RecipeId))
            .Select(recipe => recipe.RecipeId)
            .ToListAsync(cancellationToken);
        var missingRecipeIds = recipeIds.Except(existingRecipeIds).ToList();
        if (missingRecipeIds.Count > 0)
        {
            return $"No recipes found for IDs: {string.Join(", ", missingRecipeIds)}.";
        }

        var ingredientIds = items.Where(item => item.IngredientId is not null).Select(item => item.IngredientId!.Value).Distinct().ToList();
        var existingIngredientIds = await context.Ingredients
            .Where(ingredient => ingredientIds.Contains(ingredient.IngredientId))
            .Select(ingredient => ingredient.IngredientId)
            .ToListAsync(cancellationToken);
        var missingIngredientIds = ingredientIds.Except(existingIngredientIds).ToList();
        if (missingIngredientIds.Count > 0)
        {
            return $"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.";
        }

        return ValidateItems(items);
    }

    private static string? ValidateItems(IEnumerable<MealPlanRecipeRequest> items)
    {
        foreach (var item in items)
        {
            var hasRecipe = item.RecipeId is not null;
            var hasIngredient = item.IngredientId is not null;
            if (hasRecipe == hasIngredient)
            {
                return "Each meal plan item must include either a recipe or an ingredient.";
            }

            if (hasRecipe && (item.Portions is null || item.Portions <= 0m))
            {
                return "Recipe meal plan items need a positive portion count.";
            }

            if (hasIngredient && (item.Amount is null || item.Amount <= 0m || item.Unit is null || !Enum.IsDefined(item.Unit.Value)))
            {
                return "Ingredient meal plan items need a positive amount and supported unit.";
            }
        }

        return null;
    }

    public static List<MealPlanRecipe> ToModels(IEnumerable<MealPlanRecipeRequest> items) =>
        items
            .OrderBy(item => item.SortOrder)
            .Select((item, index) => new MealPlanRecipe
            {
                RecipeId = item.RecipeId,
                IngredientId = item.IngredientId,
                Role = item.Role,
                SortOrder = item.SortOrder < 0 ? index : item.SortOrder,
                Portions = item.RecipeId is null ? null : item.Portions,
                Amount = item.IngredientId is null ? null : item.Amount,
                Unit = item.IngredientId is null ? null : item.Unit
            })
            .ToList();

    /// <summary>
    /// The first problem with the shape of a batch request that needs no database to find: nothing to do, a clear
    /// range that is backwards or too long, or a slot written twice. Null when there is none.
    /// </summary>
    public static string? CheckBatchShape(
        IReadOnlyCollection<MealPlanEntryRequest> upserts,
        IReadOnlyCollection<int> deleteIds,
        MealPlanDateRange? clearRange)
    {
        if (upserts.Count == 0 && deleteIds.Count == 0 && clearRange is null)
        {
            return "Nothing to do: provide \"upsert\", \"delete\" and/or \"clearRange\".";
        }

        if (clearRange is not null)
        {
            if (clearRange.From > clearRange.To)
            {
                return "clearRange.from must be on or before clearRange.to.";
            }

            if (clearRange.To.DayNumber - clearRange.From.DayNumber >= MaxBatchRangeDays)
            {
                return $"clearRange can span at most {MaxBatchRangeDays} days.";
            }
        }

        var duplicateSlot = upserts
            .GroupBy(entry => (entry.Date, entry.Slot))
            .FirstOrDefault(group => group.Count() > 1);
        return duplicateSlot is null
            ? null
            : $"{duplicateSlot.Key.Date:yyyy-MM-dd} {duplicateSlot.Key.Slot} appears more than once in \"upsert\".";
    }

    public static MealPlanEntryDto ToDto(MealPlanEntry entry) => new(
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
