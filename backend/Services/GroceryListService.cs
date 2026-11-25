// MATFLOTE: Builds grocery-list previews from planned meals by expanding recipe ingredients and measured recipe components.
// Note: Recipe components are recursively flattened because MATFLOTE treats recipes as measurable ingredients inside other recipes.

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
                .ThenInclude(item => item.Ingredient)
                    .ThenInclude(ingredient => ingredient!.Tags)
                        .ThenInclude(tag => tag.TagDefinition)
                            .ThenInclude(tag => tag.Category)
            .Include(entry => entry.Recipes)
                .ThenInclude(item => item.Ingredient)
                    .ThenInclude(ingredient => ingredient!.Brand)
            .Where(entry => entry.Date >= from && entry.Date <= to)
            .ToListAsync(cancellationToken);

        if (entries.Count == 0)
        {
            // Nothing planned: no need to look at a single recipe.
            return new GroceryListDto(from, to, DateTimeOffset.UtcNow, []);
        }

        var plannedRecipeIds = entries
            .SelectMany(entry => entry.Recipes)
            .Where(item => item.RecipeId is not null)
            .Select(item => item.RecipeId!.Value);
        var recipesById = await LoadRecipesWithComponentsAsync(plannedRecipeIds, cancellationToken);

        var groceryRows = entries
            .SelectMany(entry => entry.Recipes)
            .SelectMany(mealPlanRecipe =>
            {
                if (mealPlanRecipe.Ingredient is not null && mealPlanRecipe.Amount is not null && mealPlanRecipe.Unit is not null)
                {
                    return [ToRow(mealPlanRecipe.Ingredient, mealPlanRecipe.Amount, mealPlanRecipe.Unit.Value, "Meal plan")];
                }

                return mealPlanRecipe.RecipeId is not null && recipesById.TryGetValue(mealPlanRecipe.RecipeId.Value, out var recipe)
                    ? BuildGroceryRows(recipe, recipesById, mealPlanRecipe.Portions)
                    : [];
            })
            .ToList();

        // Rows are already in grams or millilitres, so 200 g and 1 kg of the same ingredient become one line.
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
                var (amount, unit) = group.Key.HasKnownAmount
                    ? ToShopAmount(group.Sum(row => row.Amount ?? 0m), group.Key.Unit)
                    : ((decimal?)null, group.Key.Unit);
                var sourceRecipes = group
                    .Select(row => row.SourceRecipe)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Order(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                var tags = group.SelectMany(row => row.Tags).DistinctBy(tag => tag.Name, StringComparer.OrdinalIgnoreCase).ToList();

                return new GroceryListItemWithSection(
                    GetSectionName(tags),
                    new GroceryListItemDto(
                        group.Key.IngredientId,
                        group.Key.IngredientName,
                        group.Select(row => row.BrandName)
                            .FirstOrDefault(brandName => !string.IsNullOrWhiteSpace(brandName)),
                        amount,
                        unit,
                        amount is null,
                        FormatAmount(amount, unit),
                        sourceRecipes,
                        tags.Select(tag => tag.Name)
                            .Order(StringComparer.OrdinalIgnoreCase)
                            .ToList()
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

    /// <summary>
    /// Loads the planned recipes and every recipe their components reach, level by level, instead of the whole
    /// cookbook (AUDIT P2).
    /// </summary>
    private async Task<Dictionary<int, Recipe>> LoadRecipesWithComponentsAsync(
        IEnumerable<int> recipeIds,
        CancellationToken cancellationToken)
    {
        var recipesById = new Dictionary<int, Recipe>();
        var pending = recipeIds.ToHashSet();

        while (pending.Count > 0)
        {
            var batch = pending.ToList();
            var recipes = await context.Recipes
                .AsNoTracking()
                .AsSplitQuery()
                .Include(recipe => recipe.Ingredients)
                    .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                        .ThenInclude(ingredient => ingredient.Tags)
                            .ThenInclude(tag => tag.TagDefinition)
                                .ThenInclude(tag => tag.Category)
                .Include(recipe => recipe.Ingredients)
                    .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                        .ThenInclude(ingredient => ingredient.Brand)
                .Include(recipe => recipe.Components)
                .Where(recipe => batch.Contains(recipe.RecipeId))
                .ToListAsync(cancellationToken);

            foreach (var recipe in recipes)
            {
                recipesById[recipe.RecipeId] = recipe;
            }

            pending = recipes
                .SelectMany(recipe => recipe.Components)
                .Select(component => component.ChildRecipeId)
                .Where(id => !recipesById.ContainsKey(id))
                .ToHashSet();
        }

        return recipesById;
    }

    /// <summary>The shopping-list section each behaviour key belongs to (AUDIT B6, F15).</summary>
    private static readonly Dictionary<string, string> SectionsBySystemKey = new(StringComparer.Ordinal)
    {
        ["Produce.Vegetable"] = "Produce",
        ["Produce.Fruit"] = "Produce",
        ["Produce.Berry"] = "Produce",
        ["Produce.RootVegetable"] = "Produce",
        ["Produce.LeafyGreen"] = "Produce",
        ["Produce.Herb"] = "Produce",
        ["Protein.Chicken"] = "Protein",
        ["Protein.Fish"] = "Protein",
        ["Protein.Beef"] = "Protein",
        ["Protein.Lamb"] = "Protein",
        ["Protein.Mince"] = "Protein",
        ["Food.Dairy"] = "Dairy",
        ["Storage.Frozen"] = "Frozen",
        ["Food.Grain"] = "Pantry",
        ["Food.Spice"] = "Pantry",
        ["Format.Bread"] = "Pantry",
        ["FoodRole.Sauce"] = "Pantry",
        ["FoodRole.Dip"] = "Pantry",
    };

    // Produce before Protein before Dairy and so on, when an ingredient's tags point at several sections.
    private static readonly string[] SectionPriority = ["Produce", "Protein", "Dairy", "Frozen", "Pantry"];

    /// <summary>
    /// The section from the tags' system keys, so a renamed tag still sorts right; for tags without one, from a
    /// category named like a section (a custom "Squash" tag in "Produce"). Tag names themselves are not read.
    /// </summary>
    private static string GetSectionName(IReadOnlyCollection<GroceryTag> tags)
    {
        var byKey = tags
            .Select(tag => tag.SystemKey is not null && SectionsBySystemKey.TryGetValue(tag.SystemKey, out var section) ? section : null)
            .Where(section => section is not null)
            .ToHashSet();
        var bySystemKey = SectionPriority.FirstOrDefault(byKey.Contains);
        if (bySystemKey is not null)
        {
            return bySystemKey;
        }

        var categories = tags
            .Where(tag => tag.SystemKey is null && tag.CategoryName is not null)
            .Select(tag => tag.CategoryName!)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        return SectionPriority.FirstOrDefault(categories.Contains) ?? "Other";
    }

    /// <summary>
    /// Rounds a total in grams or millilitres up to an amount a shop sells or a scale shows, and switches to
    /// kilograms or litres from 1000. Steps: below 10 to whole units, below 100 to 5, below 500 to 10, below
    /// 1000 to 25, and from 1000 to 50 (so 733.33 g becomes 750 g and 1210 g becomes 1.25 kg).
    /// </summary>
    public static (decimal Amount, MeasurementUnit Unit) ToShopAmount(decimal baseAmount, MeasurementUnit baseUnit)
    {
        var step = baseAmount switch
        {
            < 10m => 1m,
            < 100m => 5m,
            < 500m => 10m,
            < 1000m => 25m,
            _ => 50m
        };
        var rounded = baseAmount <= 0m ? 0m : Math.Ceiling(baseAmount / step) * step;
        if (rounded < 1000m)
        {
            return (rounded, baseUnit);
        }

        return (rounded / 1000m, baseUnit == MeasurementUnit.Milliliter ? MeasurementUnit.Liter : MeasurementUnit.Kilogram);
    }

    private static GroceryIngredientRow ToRow(Ingredient ingredient, decimal? amount, MeasurementUnit unit, string sourceRecipe) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Brand?.Name,
        ToBaseAmount(amount, unit),
        GetMeasurementFamily(unit) == "volume" ? MeasurementUnit.Milliliter : MeasurementUnit.Gram,
        sourceRecipe,
        ingredient.Tags
            .Select(tag => new GroceryTag(tag.TagDefinition.Name, tag.TagDefinition.SystemKey, tag.TagDefinition.Category?.Name))
            .ToList()
    );

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
        IReadOnlyDictionary<int, Recipe> recipesById,
        decimal? selectedPortions
    )
    {
        var rows = new List<GroceryIngredientRow>();
        AddRecipeRows(recipe, recipe.Name, recipe.Name, recipesById, rows, [], GetPortionFactor(recipe, selectedPortions));
        return rows;
    }

    private static void AddRecipeRows(
        Recipe recipe,
        string rootRecipeName,
        string sourceRecipeName,
        IReadOnlyDictionary<int, Recipe> recipesById,
        List<GroceryIngredientRow> rows,
        HashSet<int> visitedRecipeIds,
        decimal portionFactor
    )
    {
        if (!visitedRecipeIds.Add(recipe.RecipeId))
        {
            return;
        }

        rows.AddRange(recipe.Ingredients.Select(recipeIngredient => ToRow(
            recipeIngredient.Ingredient,
            recipeIngredient.Amount * portionFactor,
            recipeIngredient.Unit,
            sourceRecipeName)));

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
                visitedRecipeIds,
                portionFactor * GetComponentFactor(component, childRecipe)
            );
        }

        visitedRecipeIds.Remove(recipe.RecipeId);
    }

    private static decimal GetPortionFactor(Recipe recipe, decimal? selectedPortions)
    {
        var basePortions = recipe.Portions <= 0m ? 1m : recipe.Portions;
        var portions = selectedPortions is null or <= 0m ? basePortions : selectedPortions.Value;
        return portions / basePortions;
    }

    private static decimal GetComponentFactor(RecipeComponent component, Recipe childRecipe)
    {
        var componentBaseAmount = ToBaseAmount(component.Amount, component.Unit);
        var recipeBaseAmount = GetRecipeBaseAmount(childRecipe, component.Unit);

        return componentBaseAmount is null || recipeBaseAmount is null or <= 0m
            ? 1m
            : componentBaseAmount.Value / recipeBaseAmount.Value;
    }

    private static decimal? GetRecipeBaseAmount(Recipe recipe, MeasurementUnit targetUnit)
    {
        var targetFamily = GetMeasurementFamily(targetUnit);
        if (targetFamily is null)
        {
            return null;
        }

        var total = recipe.Ingredients
            .Where(recipeIngredient => GetMeasurementFamily(recipeIngredient.Unit) == targetFamily)
            .Select(recipeIngredient => ToBaseAmount(recipeIngredient.Amount, recipeIngredient.Unit))
            .Where(amount => amount is not null)
            .Sum(amount => amount!.Value);

        return total > 0m ? total : null;
    }

    private static decimal? ToBaseAmount(decimal? amount, MeasurementUnit unit)
    {
        if (amount is null)
        {
            return null;
        }

        return unit switch
        {
            MeasurementUnit.Gram => amount,
            MeasurementUnit.Kilogram => amount * 1000m,
            MeasurementUnit.Milliliter => amount,
            MeasurementUnit.Liter => amount * 1000m,
            _ => null
        };
    }

    private static string? GetMeasurementFamily(MeasurementUnit unit) => unit switch
    {
        MeasurementUnit.Gram or MeasurementUnit.Kilogram => "mass",
        MeasurementUnit.Milliliter or MeasurementUnit.Liter => "volume",
        _ => null
    };

    /// <summary>One ingredient line from a planned recipe or meal, with the amount in grams or millilitres.</summary>
    private record GroceryIngredientRow(
        int IngredientId,
        string IngredientName,
        string? BrandName,
        decimal? Amount,
        MeasurementUnit Unit,
        string SourceRecipe,
        IReadOnlyCollection<GroceryTag> Tags
    );

    private record GroceryTag(string Name, string? SystemKey, string? CategoryName);

    private record GroceryListItemWithSection(
        string SectionName,
        GroceryListItemDto Item
    );
}
