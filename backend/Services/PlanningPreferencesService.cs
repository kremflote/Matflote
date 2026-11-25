// MATFLOTE: Reads and writes the household's planning preferences (people eating, protein minimums, things to avoid).
// Note: Stored as one JSON value in AppSettings, except people eating, which is the Nutrition page's existing setting.

using System.Text.Json;
using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class PlanningPreferencesService(DinnerPlannerContext context)
{
    public const int MaxPeopleEating = 20;
    public const int MaxRepeatAfterWeeks = 12;
    public const int MaxAvoidEntries = 50;
    public const int NotesMaxLength = 1000;

    public static readonly PlanningPreferencesDto Defaults = new(1, 1, 2, [], [], 3, null);

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<PlanningPreferencesDto> GetAsync(CancellationToken cancellationToken)
    {
        var stored = await context.AppSettings
            .AsNoTracking()
            .Where(setting => setting.Key == AppSettingKeys.PlanningPreferences || setting.Key == AppSettingKeys.NutritionPeopleEating)
            .ToDictionaryAsync(setting => setting.Key, setting => setting.Value, cancellationToken);

        var preferences = Parse(stored.GetValueOrDefault(AppSettingKeys.PlanningPreferences));
        var peopleEating = int.TryParse(stored.GetValueOrDefault(AppSettingKeys.NutritionPeopleEating), out var people) && people >= 1
            ? Math.Min(people, MaxPeopleEating)
            : Defaults.PeopleEating;

        // Names of tags or ingredients that were deleted or renamed since are dropped, so the form can be saved again.
        var tagNames = await context.IngredientTagDefinitions.AsNoTracking().Select(tag => tag.Name).ToListAsync(cancellationToken);
        var ingredientNames = await context.Ingredients.AsNoTracking().Select(ingredient => ingredient.IngredientName).ToListAsync(cancellationToken);

        return preferences with
        {
            PeopleEating = peopleEating,
            AvoidTags = Canonical(preferences.AvoidTags, tagNames, []),
            AvoidIngredients = Canonical(preferences.AvoidIngredients, ingredientNames, []),
        };
    }

    /// <summary>Validates and saves. Returns the error message, or null when it was saved.</summary>
    public async Task<string?> SaveAsync(PlanningPreferencesDto request, CancellationToken cancellationToken)
    {
        if (request.PeopleEating is < 1 or > MaxPeopleEating)
        {
            return $"peopleEating must be between 1 and {MaxPeopleEating}.";
        }

        if (request.MinFishDinnersPerWeek is < 0 or > 7 || request.MinChickenDinnersPerWeek is < 0 or > 7)
        {
            return "The minimum fish and chicken dinners must each be between 0 and 7.";
        }

        if (request.MinFishDinnersPerWeek + request.MinChickenDinnersPerWeek > 7)
        {
            return "The minimum fish and chicken dinners together cannot be more than 7 a week.";
        }

        if (request.RepeatAfterWeeks is < 0 or > MaxRepeatAfterWeeks)
        {
            return $"repeatAfterWeeks must be between 0 and {MaxRepeatAfterWeeks}.";
        }

        var notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        if (notes?.Length > NotesMaxLength)
        {
            return $"notes can be at most {NotesMaxLength} characters.";
        }

        if ((request.AvoidTags?.Count ?? 0) > MaxAvoidEntries || (request.AvoidIngredients?.Count ?? 0) > MaxAvoidEntries)
        {
            return $"List at most {MaxAvoidEntries} tags and {MaxAvoidEntries} ingredients to avoid.";
        }

        var tagNames = await context.IngredientTagDefinitions.AsNoTracking().Select(tag => tag.Name).ToListAsync(cancellationToken);
        var ingredientNames = await context.Ingredients.AsNoTracking().Select(ingredient => ingredient.IngredientName).ToListAsync(cancellationToken);
        var unknownTags = new List<string>();
        var unknownIngredients = new List<string>();
        var avoidTags = Canonical(request.AvoidTags ?? [], tagNames, unknownTags);
        var avoidIngredients = Canonical(request.AvoidIngredients ?? [], ingredientNames, unknownIngredients);
        if (unknownTags.Count > 0)
        {
            return $"Unknown tags: {string.Join(", ", unknownTags)}.";
        }

        if (unknownIngredients.Count > 0)
        {
            return $"Unknown ingredients: {string.Join(", ", unknownIngredients)}.";
        }

        var stored = new StoredPreferences(
            request.MinFishDinnersPerWeek,
            request.MinChickenDinnersPerWeek,
            avoidTags,
            avoidIngredients,
            request.RepeatAfterWeeks,
            notes);
        await SetValueAsync(AppSettingKeys.PlanningPreferences, JsonSerializer.Serialize(stored, Json), cancellationToken);
        await SetValueAsync(AppSettingKeys.NutritionPeopleEating, request.PeopleEating.ToString(), cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return null;
    }

    private static PlanningPreferencesDto Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return Defaults;
        }

        try
        {
            var stored = JsonSerializer.Deserialize<StoredPreferences>(json, Json);
            return stored is null
                ? Defaults
                : new PlanningPreferencesDto(
                    Defaults.PeopleEating,
                    Math.Clamp(stored.MinFishDinnersPerWeek, 0, 7),
                    Math.Clamp(stored.MinChickenDinnersPerWeek, 0, 7),
                    stored.AvoidTags ?? [],
                    stored.AvoidIngredients ?? [],
                    Math.Clamp(stored.RepeatAfterWeeks, 0, MaxRepeatAfterWeeks),
                    stored.Notes);
        }
        catch (JsonException)
        {
            return Defaults;
        }
    }

    /// <summary>Each requested name as it is spelled in the catalog (case and spacing ignored), without repeats.</summary>
    private static List<string> Canonical(IEnumerable<string> requested, List<string> known, List<string> unknown)
    {
        var byKey = known
            .GroupBy(AssistantService.Key)
            .ToDictionary(group => group.Key, group => group.First());
        var result = new List<string>();
        foreach (var name in requested.Where(name => !string.IsNullOrWhiteSpace(name)))
        {
            if (byKey.TryGetValue(AssistantService.Key(name), out var canonical))
            {
                if (!result.Contains(canonical, StringComparer.OrdinalIgnoreCase))
                {
                    result.Add(canonical);
                }
            }
            else
            {
                unknown.Add(name.Trim());
            }
        }

        return result;
    }

    private async Task SetValueAsync(string key, string value, CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings.FindAsync([key], cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = key };
            context.AppSettings.Add(setting);
        }

        setting.Value = value;
        setting.UpdatedAt = DateTimeOffset.UtcNow;
    }

    private sealed record StoredPreferences(
        int MinFishDinnersPerWeek,
        int MinChickenDinnersPerWeek,
        IReadOnlyCollection<string>? AvoidTags,
        IReadOnlyCollection<string>? AvoidIngredients,
        int RepeatAfterWeeks,
        string? Notes);
}
