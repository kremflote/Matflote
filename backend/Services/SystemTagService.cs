// MATFLOTE: Ensures planner/generator rule tags exist and stay identifiable across databases.
// Note: Rules use immutable SystemKey values instead of display names so users can rename tags without breaking behavior.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class SystemTagService(DinnerPlannerContext context)
{
    private static readonly SystemTagDefinition[] RequiredTags =
    [
        new("Meal.Breakfast", "Breakfast", "Meal", false, true),
        new("Meal.Lunch", "Lunch", "Meal", false, true),
        new("Meal.Dinner", "Dinner", "Meal", false, true),
        new("Protein.Fish", "Fish", "Protein", true, true),
        new("Protein.Chicken", "Chicken", "Protein", true, true),
        new("Protein.Beef", "Beef", "Protein", true, true),
        new("Protein.Lamb", "Lamb", "Protein", true, true),
        new("Protein.Mince", "Mince", "Protein", true, true),
        new("Format.Bread", "Bread", "Format", false, true),
        new("FoodRole.Topping", "Pålegg", "Food role", true, false),
    ];

    public async Task EnsureRequiredTagsAsync(CancellationToken cancellationToken = default)
    {
        foreach (var requiredTag in RequiredTags)
        {
            var existingTag = await context.IngredientTagDefinitions
                .FirstOrDefaultAsync(tag => tag.SystemKey == requiredTag.SystemKey, cancellationToken)
                ?? await context.IngredientTagDefinitions
                    .FirstOrDefaultAsync(tag => tag.Name.ToLower() == requiredTag.DefaultName.ToLower(), cancellationToken);

            if (existingTag is not null)
            {
                existingTag.IsSystemTag = true;
                existingTag.SystemKey = requiredTag.SystemKey;
                continue;
            }

            var category = await EnsureCategoryAsync(requiredTag, cancellationToken);
            category.Tags.Add(new IngredientTagDefinition
            {
                Name = requiredTag.DefaultName,
                IngredientTagCategoryId = category.IngredientTagCategoryId,
                SortOrder = GetNextTagSortOrder(category),
                IsSystemTag = true,
                SystemKey = requiredTag.SystemKey
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<IngredientTagCategory> EnsureCategoryAsync(
        SystemTagDefinition requiredTag,
        CancellationToken cancellationToken)
    {
        var category = await context.IngredientTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.Name.ToLower() == requiredTag.CategoryName.ToLower(), cancellationToken);

        if (category is not null)
        {
            return category;
        }

        var nextSortOrder = await context.IngredientTagCategories
            .Select(value => (int?)value.SortOrder)
            .MaxAsync(cancellationToken) ?? 0;

        category = new IngredientTagCategory
        {
            Name = requiredTag.CategoryName,
            SortOrder = nextSortOrder + 100,
            ShowForIngredients = requiredTag.ShowCategoryForIngredients,
            ShowForRecipes = requiredTag.ShowCategoryForRecipes
        };
        context.IngredientTagCategories.Add(category);
        await context.SaveChangesAsync(cancellationToken);

        return category;
    }

    private static int GetNextTagSortOrder(IngredientTagCategory category) =>
        category.Tags.Count == 0 ? 100 : category.Tags.Max(tag => tag.SortOrder) + 100;

    private record SystemTagDefinition(
        string SystemKey,
        string DefaultName,
        string CategoryName,
        bool ShowCategoryForIngredients,
        bool ShowCategoryForRecipes);
}
