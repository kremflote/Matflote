// MATFLOTE: Name matching and validation rules shared by the regular catalog endpoints and the assistant API.
// Note: Both surfaces resolve tags, compare names and describe bad recipe lines the same way, so a rule changes in one place.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

/// <summary>How catalog names are compared: runs of whitespace count as one space, and case is ignored.</summary>
public static class CatalogNames
{
    private const int MaxSuggestions = 3;

    /// <summary>Trims and collapses inner whitespace.</summary>
    public static string Clean(string? value) =>
        value is null ? string.Empty : string.Join(' ', value.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    /// <summary>
    /// The comparison key of a name. ToLowerInvariant folds every letter the household uses, including Æ, Ø and Å,
    /// so "Ærfuglsuppe" and "ærfuglsuppe" are the same name.
    /// </summary>
    public static string Key(string? value) => Clean(value).ToLowerInvariant();

    public static string Quote(IEnumerable<string> values) =>
        string.Join(", ", values.Select(value => $"\"{value}\""));

    /// <summary>
    /// Finds existing names that are probably what the caller meant: one contains the other, or they are a typo apart.
    /// </summary>
    public static List<string> Suggest(string name, IEnumerable<string> knownNames)
    {
        var key = Key(name);
        if (key.Length < 3)
        {
            return [];
        }

        var known = knownNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var contained = known.Where(candidate =>
        {
            var candidateKey = Key(candidate);
            return candidateKey != key
                && candidateKey.Length >= 3
                && (candidateKey.Contains(key) || key.Contains(candidateKey));
        });
        var nearDuplicate = LookupDuplicateDetector.FindNearDuplicate(name, known);

        return (nearDuplicate is null ? contained : contained.Prepend(nearDuplicate))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxSuggestions)
            .ToList();
    }
}

public static class RecipeLineRules
{
    public static string DescribeUnknownPreparation(string? value) =>
        $"preparation \"{value}\" is not valid. Leave it out or use one of: "
        + $"{string.Join(", ", Enum.GetNames<IngredientPreparation>().Where(name => name != nameof(IngredientPreparation.None)))}.";
}

public enum TagUse
{
    Ingredient,
    Recipe
}

/// <summary>
/// Tag lookup that forgives case, spaces and hyphens ("root vegetable" matches "RootVegetable").
/// </summary>
public sealed class TagIndex(List<IngredientTagDefinition> definitions)
{
    /// <summary>The hint after an unknown tag on the regular endpoints.</summary>
    public const string CreateFirstHint = "Tags must already exist: create it under tag management first.";

    private readonly Dictionary<string, IngredientTagDefinition> byKey = definitions
        .GroupBy(tag => TagKey(tag.Name))
        .ToDictionary(group => group.Key, group => group.First());

    public static async Task<TagIndex> LoadAsync(DinnerPlannerContext context, CancellationToken cancellationToken) =>
        new(await context.IngredientTagDefinitions.AsNoTracking().Include(tag => tag.Category).ToListAsync(cancellationToken));

    /// <summary>
    /// Resolves tag names to definitions. Unknown names are added to <paramref name="errors"/>, with suggestions and
    /// <paramref name="unknownHint"/>; a tag whose category the web app hides for this kind of item adds a warning.
    /// </summary>
    public List<IngredientTagDefinition> Resolve(
        IReadOnlyCollection<string> names,
        TagUse use,
        List<string> errors,
        List<string> warnings,
        string unknownHint)
    {
        var resolved = new List<IngredientTagDefinition>();
        foreach (var name in names)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            if (byKey.TryGetValue(TagKey(name), out var definition))
            {
                if (!resolved.Contains(definition))
                {
                    resolved.Add(definition);
                    // The web app hides tags of a category that is not shown for this kind of item.
                    var shown = use == TagUse.Recipe ? definition.Category?.ShowForRecipes : definition.Category?.ShowForIngredients;
                    if (shown == false)
                    {
                        warnings.Add(
                            $"Tag \"{definition.Name}\" belongs to category \"{definition.Category!.Name}\", which is not used for "
                            + $"{(use == TagUse.Recipe ? "recipes" : "ingredients")} (see forRecipes / forIngredients in tagCategories). It was saved but the web app does not show it.");
                    }
                }

                continue;
            }

            var suggestions = CatalogNames.Suggest(name, definitions.Select(tag => tag.Name));
            errors.Add(
                $"Unknown tag \"{name.Trim()}\"."
                + (suggestions.Count == 0 ? string.Empty : $" Did you mean {CatalogNames.Quote(suggestions)}?")
                + " " + unknownHint);
        }

        return resolved;
    }

    private static string TagKey(string name) =>
        new string(name.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
}
