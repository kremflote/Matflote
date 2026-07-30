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
        var definitions = await NormalizeKnownTagDefinitionsAsync(tags, cancellationToken);
        return definitions.Select(definition => definition.Name).ToList();
    }

    public async Task<List<IngredientTagDefinition>> NormalizeKnownTagDefinitionsAsync(
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
            .ToListAsync(cancellationToken);

        return requestedTags
            .Select(requestedTag => knownTags.FirstOrDefault(knownTag =>
                string.Equals(knownTag.Name, requestedTag, StringComparison.OrdinalIgnoreCase)))
            .Where(tag => tag is not null)
            .Select(tag => tag!)
            .DistinctBy(tag => tag.IngredientTagDefinitionId)
            .OrderBy(tag => tag.Name, StringComparer.OrdinalIgnoreCase)
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
            .Include(assignment => assignment.TagDefinition)
            .Where(assignment => normalizedNames.Contains(assignment.TagDefinition.Name.ToLower()))
            .ToListAsync(cancellationToken);
        var recipeAssignments = await context.RecipeTagAssignments
            .Include(assignment => assignment.TagDefinition)
            .Where(assignment => normalizedNames.Contains(assignment.TagDefinition.Name.ToLower()))
            .ToListAsync(cancellationToken);

        context.IngredientTagAssignments.RemoveRange(ingredientAssignments);
        context.RecipeTagAssignments.RemoveRange(recipeAssignments);
    }

    public async Task RemoveOrphanedAssignmentsAsync(CancellationToken cancellationToken = default)
    {
        var orphanedIngredientAssignments = await context.IngredientTagAssignments
            .Where(assignment => !context.IngredientTagDefinitions.Any(tag =>
                tag.IngredientTagDefinitionId == assignment.IngredientTagDefinitionId))
            .ToListAsync(cancellationToken);
        var orphanedRecipeAssignments = await context.RecipeTagAssignments
            .Where(assignment => !context.IngredientTagDefinitions.Any(tag =>
                tag.IngredientTagDefinitionId == assignment.IngredientTagDefinitionId))
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
