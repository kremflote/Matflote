// MATFLOTE: Version counters for the catalog lists the browser loads on every page.
// Note: The counters live in memory, so the ETag also carries a random id for this process; a restart changes every tag.

using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Services;

public enum CatalogGroup
{
    Recipes,
    Ingredients,
    Tags,
    Brands
}

public sealed class CatalogVersion
{
    private static readonly CatalogGroup[] AllGroups = Enum.GetValues<CatalogGroup>();

    // Which lists embed each entity type. Recipe responses embed ingredients (name, brand, image, tags, colour),
    // ingredient responses embed brands and tag names, and both carry thumbnail URLs from UploadedImages.
    private static readonly Dictionary<Type, CatalogGroup[]> GroupsByEntityType = new()
    {
        [typeof(Recipe)] = [CatalogGroup.Recipes],
        [typeof(RecipeIngredient)] = [CatalogGroup.Recipes],
        [typeof(RecipeComponent)] = [CatalogGroup.Recipes],
        [typeof(RecipeTagAssignment)] = [CatalogGroup.Recipes],
        [typeof(Ingredient)] = [CatalogGroup.Ingredients, CatalogGroup.Recipes],
        [typeof(NutritionFacts)] = [CatalogGroup.Ingredients, CatalogGroup.Recipes],
        [typeof(IngredientTagAssignment)] = [CatalogGroup.Ingredients, CatalogGroup.Recipes],
        [typeof(Brand)] = [CatalogGroup.Brands, CatalogGroup.Ingredients, CatalogGroup.Recipes],
        [typeof(IngredientTagDefinition)] = [CatalogGroup.Tags, CatalogGroup.Ingredients, CatalogGroup.Recipes],
        [typeof(IngredientTagCategory)] = [CatalogGroup.Tags, CatalogGroup.Ingredients, CatalogGroup.Recipes],
        [typeof(UploadedImage)] = [CatalogGroup.Recipes, CatalogGroup.Ingredients],
    };

    private readonly long[] counters = new long[AllGroups.Length];

    public string ProcessId { get; } = Guid.NewGuid().ToString("N")[..12];

    public long Get(CatalogGroup group) => Interlocked.Read(ref counters[(int)group]);

    public void Bump(CatalogGroup group) => Interlocked.Increment(ref counters[(int)group]);

    public void Bump(IEnumerable<CatalogGroup> groups)
    {
        foreach (var group in groups.Distinct())
        {
            Bump(group);
        }
    }

    /// <summary>A weak validator such as <c>W/"3f2a9c1b04de-recipes-7"</c>.</summary>
    public string GetETag(CatalogGroup group) =>
        $"W/\"{ProcessId}-{group.ToString().ToLowerInvariant()}-{Get(group)}\"";

    public static IEnumerable<CatalogGroup> GroupsAffectedBy(Type entityType) =>
        GroupsByEntityType.TryGetValue(entityType, out var groups) ? groups : [];
}
