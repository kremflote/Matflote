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
            .Where(entry => entry.Date >= from && entry.Date <= to)
            .ToListAsync(cancellationToken);

        var allRecipes = await context.Recipes
            .AsNoTracking()
            .Include(recipe => recipe.Ingredients)
                .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                    .ThenInclude(ingredient => ingredient.Tags)
            .Include(recipe => recipe.Ingredients)
                .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                    .ThenInclude(ingredient => ingredient.Brand)
            .Include(recipe => recipe.Components)
            .ToListAsync(cancellationToken);
        var recipesById = allRecipes.ToDictionary(recipe => recipe.RecipeId);

        var groceryRows = entries
            .SelectMany(entry => entry.Recipes)
            .SelectMany(mealPlanRecipe =>
                recipesById.TryGetValue(mealPlanRecipe.RecipeId, out var recipe)
                    ? BuildGroceryRows(recipe, recipesById)
                    : [])
            .ToList();

        var items = groceryRows
            .GroupBy(row => new
            {
                row.IngredientId,
                row.IngredientName,
                row.Unit,
                HasKnownAmount = row.Amount.HasValue
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

    private static string GetSectionName(IEnumerable<string> tags)
    {
        var tagSet = tags.ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (tagSet.Overlaps(["Vegetable", "Fruit", "Berry", "RootVegetable", "LeafyGreen", "Herb"]))
        {
            return "Produce";
        }

        if (tagSet.Overlaps(["Chicken", "Fish", "Beef", "Lamb", "Mince"]))
        {
            return "Protein";
        }

        if (tagSet.Contains("Dairy"))
        {
            return "Dairy";
        }

        if (tagSet.Contains("Frozen"))
        {
            return "Frozen";
        }

        if (tagSet.Overlaps(["Grain", "Bread", "Spice", "Sauce", "Dip", "Pantry"]))
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
        if (amount is null)
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
        _ => unit.ToString()
    };

    private static List<GroceryIngredientRow> BuildGroceryRows(
        Recipe recipe,
        IReadOnlyDictionary<int, Recipe> recipesById
    )
    {
        var rows = new List<GroceryIngredientRow>();
        AddRecipeRows(recipe, recipe.Name, recipe.Name, recipesById, rows, []);
        return rows;
    }

    private static void AddRecipeRows(
        Recipe recipe,
        string rootRecipeName,
        string sourceRecipeName,
        IReadOnlyDictionary<int, Recipe> recipesById,
        List<GroceryIngredientRow> rows,
        HashSet<int> visitedRecipeIds
    )
    {
        if (!visitedRecipeIds.Add(recipe.RecipeId))
        {
            return;
        }

        rows.AddRange(recipe.Ingredients.Select(recipeIngredient => new GroceryIngredientRow(
            recipeIngredient.IngredientId,
            recipeIngredient.Ingredient.IngredientName,
            recipeIngredient.Ingredient.Brand?.Name,
            recipeIngredient.Amount,
            recipeIngredient.Unit,
            sourceRecipeName,
            recipeIngredient.Ingredient.Tags.Select(tag => tag.Tag).ToList()
        )));

        foreach (var component in recipe.Components.OrderBy(component => component.SortOrder))
        {
            if (!recipesById.TryGetValue(component.ChildRecipeId, out var childRecipe))
            {
                continue;
            }

            AddRecipeRows(
                childRecipe,
                rootRecipeName,
                $"{childRecipe.Name} via {rootRecipeName}",
                recipesById,
                rows,
                visitedRecipeIds
            );
        }

        visitedRecipeIds.Remove(recipe.RecipeId);
    }

    private record GroceryIngredientRow(
        int IngredientId,
        string IngredientName,
        string? BrandName,
        decimal? Amount,
        MeasurementUnit Unit,
        string SourceRecipe,
        IReadOnlyCollection<string> Tags
    );

    private record GroceryListItemWithSection(
        string SectionName,
        GroceryListItemDto Item
    );
}
