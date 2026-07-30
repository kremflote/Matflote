using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class TagCatalogService(DinnerPlannerContext context)
{
    public async Task<List<string>> NormalizeKnownTagsAsync(
        IReadOnlyCollection<string>? tags,
        CancellationToken cancellationToken = default)
    {
        var requestedTags = NormalizeTags(tags);
        if (requestedTags.Count == 0)
        {
            return [];
        }

        var knownTags = await context.IngredientTagDefinitions
            .AsNoTracking()
            .Select(tag => tag.Name)
            .ToListAsync(cancellationToken);

        return requestedTags
            .Select(requestedTag => knownTags.FirstOrDefault(knownTag =>
                string.Equals(knownTag, requestedTag, StringComparison.OrdinalIgnoreCase)))
            .Where(tag => tag is not null)
            .Select(tag => tag!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task DeleteTagAssignmentsAsync(
        IReadOnlyCollection<string> tagNames,
        CancellationToken cancellationToken = default)
    {
        var normalizedNames = tagNames
            .Select(tag => tag.Trim().ToLower())
            .Where(tag => tag.Length > 0)
            .Distinct()
            .ToList();

        if (normalizedNames.Count == 0)
        {
            return;
        }

        var ingredientAssignments = await context.IngredientTagAssignments
            .Where(assignment => normalizedNames.Contains(assignment.Tag.ToLower()))
            .ToListAsync(cancellationToken);
        var recipeAssignments = await context.RecipeTagAssignments
            .Where(assignment => normalizedNames.Contains(assignment.Tag.ToLower()))
            .ToListAsync(cancellationToken);

        context.IngredientTagAssignments.RemoveRange(ingredientAssignments);
        context.RecipeTagAssignments.RemoveRange(recipeAssignments);
    }

    public async Task RemoveOrphanedAssignmentsAsync(CancellationToken cancellationToken = default)
    {
        var knownTags = await context.IngredientTagDefinitions
            .AsNoTracking()
            .Select(tag => tag.Name.ToLower())
            .ToListAsync(cancellationToken);
        var orphanedIngredientAssignments = await context.IngredientTagAssignments
            .Where(assignment => !knownTags.Contains(assignment.Tag.ToLower()))
            .ToListAsync(cancellationToken);
        var orphanedRecipeAssignments = await context.RecipeTagAssignments
            .Where(assignment => !knownTags.Contains(assignment.Tag.ToLower()))
            .ToListAsync(cancellationToken);

        context.IngredientTagAssignments.RemoveRange(orphanedIngredientAssignments);
        context.RecipeTagAssignments.RemoveRange(orphanedRecipeAssignments);
    }

    private static List<string> NormalizeTags(IReadOnlyCollection<string>? tags) =>
        tags is null
            ? []
            : tags
                .Select(tag => tag.Trim())
                .Where(tag => tag.Length > 0 && tag.Length <= 64)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
}
