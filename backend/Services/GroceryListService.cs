using System.Globalization;
using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class GroceryListService(DinnerPlannerContext context)
{
    private static readonly string[] SectionOrder =
    [
        "Produce",
        "Protein",
        "Dairy",
        "Pantry",
        "Frozen",
        "Other"
    ];

    public async Task<GroceryListDto> BuildAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        var entries = await context.MealPlanEntries
            .AsNoTracking()
            .Include(entry => entry.Recipes)
                .ThenInclude(mealPlanRecipe => mealPlanRecipe.Recipe)
                    .ThenInclude(recipe => recipe.Ingredients)
                        .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                            .ThenInclude(ingredient => ingredient.Tags)
            .Include(entry => entry.Recipes)
                .ThenInclude(mealPlanRecipe => mealPlanRecipe.Recipe)
                    .ThenInclude(recipe => recipe.Ingredients)
                        .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                            .ThenInclude(ingredient => ingredient.Brand)
            .Where(entry => entry.Date >= from && entry.Date <= to)
            .ToListAsync(cancellationToken);

        var groceryRows = entries
            .SelectMany(entry => entry.Recipes)
            .SelectMany(mealPlanRecipe => mealPlanRecipe.Recipe.Ingredients.Select(recipeIngredient => new GroceryIngredientRow(
                recipeIngredient.IngredientId,
                recipeIngredient.Ingredient.IngredientName,
                recipeIngredient.Ingredient.Brand?.Name,
                recipeIngredient.Amount,
                recipeIngredient.Unit,
                mealPlanRecipe.Recipe.Name,
                recipeIngredient.Ingredient.Tags.Select(tag => tag.Tag).ToList()
            )))
            .ToList();

        var items = groceryRows
            .GroupBy(row => new
            {
                row.IngredientId,
                row.IngredientName,
                row.Unit,
                HasKnownAmount = row.Amount.HasValue && row.Unit != MeasurementUnit.ToTaste
            })
            .Select(group =>
            {
                var amount = group.Key.HasKnownAmount
                    ? group.Sum(row => row.Amount ?? 0m)
                    : (decimal?)null;
                var sourceRecipes = group
                    .Select(row => row.SourceRecipe)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Order(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                return new GroceryListItemWithSection(
                    GetSectionName(group.SelectMany(row => row.Tags)),
                    new GroceryListItemDto(
                        group.Key.IngredientId,
                        group.Key.IngredientName,
                        group.Select(row => row.BrandName)
                            .FirstOrDefault(brandName => !string.IsNullOrWhiteSpace(brandName)),
                        amount,
                        group.Key.Unit,
                        amount is null,
                        FormatAmount(amount, group.Key.Unit),
                        sourceRecipes
                    )
                );
            })
            .OrderBy(item => GetSectionSortOrder(item.SectionName))
            .ThenBy(item => item.Item.IngredientName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var sections = items
            .GroupBy(item => item.SectionName)
            .OrderBy(group => GetSectionSortOrder(group.Key))
            .Select(group => new GroceryListSectionDto(
                group.Key,
                group.Select(item => item.Item).ToList()
            ))
            .ToList();

        return new GroceryListDto(from, to, DateTimeOffset.UtcNow, sections);
    }

    private static string GetSectionName(IEnumerable<IngredientTag> tags)
    {
        var tagSet = tags.ToHashSet();

        if (tagSet.Overlaps([IngredientTag.Vegetable, IngredientTag.Fruit, IngredientTag.LeafyGreen, IngredientTag.Herb]))
        {
            return "Produce";
        }

        if (tagSet.Overlaps([IngredientTag.Chicken, IngredientTag.Fish, IngredientTag.Beef, IngredientTag.Lamb, IngredientTag.Mince]))
        {
            return "Protein";
        }

        if (tagSet.Contains(IngredientTag.Dairy))
        {
            return "Dairy";
        }

        if (tagSet.Contains(IngredientTag.Frozen))
        {
            return "Frozen";
        }

        if (tagSet.Overlaps([IngredientTag.Grain, IngredientTag.Spice, IngredientTag.Sauce, IngredientTag.Pantry]))
        {
            return "Pantry";
        }

        return "Other";
    }

    private static int GetSectionSortOrder(string sectionName)
    {
        var index = Array.IndexOf(SectionOrder, sectionName);
        return index < 0 ? SectionOrder.Length : index;
    }

    private static string FormatAmount(decimal? amount, MeasurementUnit unit)
    {
        if (amount is null || unit == MeasurementUnit.ToTaste)
        {
            return "as needed";
        }

        return $"{amount.Value.ToString("0.##", CultureInfo.InvariantCulture)} {FormatUnit(unit, amount.Value)}";
    }

    private static string FormatUnit(MeasurementUnit unit, decimal amount) => unit switch
    {
        MeasurementUnit.Gram => "g",
        MeasurementUnit.Kilogram => "kg",
        MeasurementUnit.Milliliter => "ml",
        MeasurementUnit.Liter => "l",
        MeasurementUnit.Teaspoon => amount == 1m ? "teaspoon" : "teaspoons",
        MeasurementUnit.Tablespoon => amount == 1m ? "tablespoon" : "tablespoons",
        MeasurementUnit.Cup => amount == 1m ? "cup" : "cups",
        MeasurementUnit.Piece => amount == 1m ? "piece" : "pieces",
        MeasurementUnit.Clove => amount == 1m ? "clove" : "cloves",
        MeasurementUnit.Pinch => amount == 1m ? "pinch" : "pinches",
        MeasurementUnit.ToTaste => "to taste",
        _ => unit.ToString()
    };

    private record GroceryIngredientRow(
        int IngredientId,
        string IngredientName,
        string? BrandName,
        decimal? Amount,
        MeasurementUnit Unit,
        string SourceRecipe,
        IReadOnlyCollection<IngredientTag> Tags
    );

    private record GroceryListItemWithSection(
        string SectionName,
        GroceryListItemDto Item
    );
}
