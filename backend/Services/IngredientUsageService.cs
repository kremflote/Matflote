// MATFLOTE: Finds where an ingredient is used, and replaces it with another one everywhere.
// Note: Deleting an ingredient that recipes or planned meals still use is refused; replacing is the safe way to merge duplicates.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class IngredientUsageService(DinnerPlannerContext context)
{
    /// <summary>The recipes and planned meals that use the ingredient; both lists are empty when it is unused.</summary>
    public async Task<IngredientInUseDto> FindUsesAsync(int ingredientId, string ingredientName, CancellationToken cancellationToken = default)
    {
        var recipes = await context.RecipeIngredients
            .AsNoTracking()
            .Where(line => line.IngredientId == ingredientId)
            .Select(line => new IngredientUseRecipeDto(line.RecipeId, line.Recipe.Name))
            .ToListAsync(cancellationToken);
        var meals = await context.MealPlanRecipes
            .AsNoTracking()
            .Where(item => item.IngredientId == ingredientId)
            .Select(item => new IngredientUseMealDto(item.MealPlanEntryId, item.MealPlanEntry.Date, item.MealPlanEntry.Slot))
            .Distinct()
            .ToListAsync(cancellationToken);

        recipes = recipes.OrderBy(recipe => recipe.Name, StringComparer.CurrentCultureIgnoreCase).ToList();
        meals = meals.OrderBy(meal => meal.Date).ThenBy(meal => meal.Slot).ToList();

        var parts = new List<string>();
        if (recipes.Count > 0)
        {
            parts.Add($"{recipes.Count} recipe{(recipes.Count == 1 ? "" : "s")} ({CatalogNames.Quote(recipes.Select(recipe => recipe.Name))})");
        }

        if (meals.Count > 0)
        {
            parts.Add($"{meals.Count} planned meal{(meals.Count == 1 ? "" : "s")}");
        }

        var error = $"\"{ingredientName}\" is used by {string.Join(" and ", parts)}. "
            + "Replace it with another ingredient (POST /api/ingredients/{id}/replace-with/{otherId}) or remove it from those first.";
        return new IngredientInUseDto(error, recipes, meals);
    }

    /// <summary>
    /// Points every recipe line and planned item of <paramref name="source"/> at <paramref name="target"/>, then deletes
    /// <paramref name="source"/>. A recipe that has both gets one line with the amounts added together. Returns the
    /// problems that prevent this (nothing is changed then), or the counts. Does not save.
    /// </summary>
    public async Task<(List<string> Problems, int Moved, int Merged, int MealItems)> StageReplacementAsync(
        Ingredient source,
        Ingredient target,
        CancellationToken cancellationToken = default)
    {
        var sourceLines = await context.RecipeIngredients
            .Include(line => line.Recipe)
            .Where(line => line.IngredientId == source.IngredientId)
            .ToListAsync(cancellationToken);
        var recipeIds = sourceLines.Select(line => line.RecipeId).ToList();
        var targetLines = await context.RecipeIngredients
            .Where(line => line.IngredientId == target.IngredientId && recipeIds.Contains(line.RecipeId))
            .ToDictionaryAsync(line => line.RecipeId, cancellationToken);

        var problems = new List<string>();
        foreach (var line in sourceLines)
        {
            if (targetLines.TryGetValue(line.RecipeId, out var targetLine)
                && AssistantUnits.IsMass(line.Unit) != AssistantUnits.IsMass(targetLine.Unit))
            {
                problems.Add(
                    $"Recipe \"{line.Recipe.Name}\" has both, one measured by weight and one by volume, so the amounts cannot be added. "
                    + "Edit that recipe first.");
            }
        }

        if (problems.Count > 0)
        {
            return (problems, 0, 0, 0);
        }

        var moved = 0;
        var merged = 0;
        foreach (var line in sourceLines)
        {
            if (!targetLines.TryGetValue(line.RecipeId, out var targetLine))
            {
                line.IngredientId = target.IngredientId;
                moved++;
                continue;
            }

            targetLine.Amount = AddAmounts(line, targetLine, out var unit);
            targetLine.Unit = unit;
            if (targetLine.Preparation == IngredientPreparation.None)
            {
                targetLine.Preparation = line.Preparation;
            }

            context.RecipeIngredients.Remove(line);
            merged++;
        }

        var mealItems = await context.MealPlanRecipes
            .Where(item => item.IngredientId == source.IngredientId)
            .ToListAsync(cancellationToken);
        foreach (var item in mealItems)
        {
            item.IngredientId = target.IngredientId;
        }

        context.Ingredients.Remove(source);
        return (problems, moved, merged, mealItems.Count);
    }

    /// <summary>Same unit: kept. Otherwise grams or millilitres. A line without an amount adds nothing.</summary>
    private static decimal? AddAmounts(RecipeIngredient first, RecipeIngredient second, out MeasurementUnit unit)
    {
        if (first.Unit == second.Unit)
        {
            unit = second.Unit;
            return first.Amount is null && second.Amount is null ? null : (first.Amount ?? 0m) + (second.Amount ?? 0m);
        }

        unit = AssistantUnits.IsMass(second.Unit) ? MeasurementUnit.Gram : MeasurementUnit.Milliliter;
        return first.Amount is null && second.Amount is null
            ? null
            : Math.Round(AssistantUnits.ToBase(first.Amount, first.Unit) + AssistantUnits.ToBase(second.Amount, second.Unit), 2);
    }
}
