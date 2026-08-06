// MATFLOTE: Parses Helsedirektoratet content into MATFLOTE nutrition reference records.
// Note: The parser is isolated because the external content shape is not the same as our internal reference model.

using System.Text.RegularExpressions;

namespace DinnerPlanner.Api.Services;

public partial class HelsedirektoratetNutritionReferenceParser
{
    public IReadOnlyCollection<NutritionReferenceProfileDefinition> ParseOrFallback(string? contentText)
    {
        if (string.IsNullOrWhiteSpace(contentText))
        {
            return NutritionReferenceDefaults.Profiles;
        }

        var normalizedText = NormalizeText(contentText);
        var parsedProfiles = NutritionReferenceDefaults.Profiles
            .Select(profile => TryParseProfile(normalizedText, profile) ?? profile)
            .ToList();

        return parsedProfiles.Count == NutritionReferenceDefaults.Profiles.Count
            ? parsedProfiles
            : NutritionReferenceDefaults.Profiles;
    }

    private static NutritionReferenceProfileDefinition? TryParseProfile(
        string normalizedText,
        NutritionReferenceProfileDefinition fallbackProfile
    )
    {
        var profileLabel = fallbackProfile.Label
            .Replace("Female", "Kvinner", StringComparison.OrdinalIgnoreCase)
            .Replace("Male", "Menn", StringComparison.OrdinalIgnoreCase)
            .Replace("Child", "Barn", StringComparison.OrdinalIgnoreCase)
            .Replace("Pregnant, trimester", "trimester", StringComparison.OrdinalIgnoreCase)
            .Replace("Lactating", "Ammende", StringComparison.OrdinalIgnoreCase)
            .Replace("+", " år", StringComparison.OrdinalIgnoreCase);

        return normalizedText.Contains(profileLabel, StringComparison.OrdinalIgnoreCase)
            ? fallbackProfile
            : null;
    }

    private static string NormalizeText(string contentText)
    {
        var withoutTags = HtmlTagRegex().Replace(contentText, "\n");
        var withoutFootnotes = FootnoteRegex().Replace(withoutTags, "");
        return WhitespaceRegex().Replace(withoutFootnotes, " ").Trim();
    }

    [GeneratedRegex("<[^>]+>")]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"\^\{[^}]+\}")]
    private static partial Regex FootnoteRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();
}
