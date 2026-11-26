// MATFLOTE: Reads and writes household-level app settings such as integrations, export rules, image storage, and nutrition preferences.
// Note: Secrets are write-only from the UI: saved values can be replaced, but existing tokens are not returned to the browser.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class AppSettingsService(
    DinnerPlannerContext context,
    IConfiguration configuration,
    IWebHostEnvironment environment,
    ImageStoragePathProvider imageStorage
)
{
    public async Task<AppSettingsDto> GetAsync(CancellationToken cancellationToken)
    {
        // One query for the whole table instead of one per key (AUDIT P4); configuration fills the gaps.
        var stored = await context.AppSettings
            .AsNoTracking()
            .ToDictionaryAsync(setting => setting.Key, setting => setting.Value, cancellationToken);
        string? Value(string key) => stored.TryGetValue(key, out var value) && value is not null ? value : configuration[key];

        var provider = Value(AppSettingKeys.ExportProvider) ?? "Vikunja";
        var taskMode = Value(AppSettingKeys.ExportTaskMode) ?? ExportTaskModes.SingleTask;
        var baseUrl = Value(AppSettingKeys.VikunjaBaseUrl) ?? string.Empty;
        var projectIdValue = Value(AppSettingKeys.VikunjaProjectId);
        var apiToken = Value(AppSettingKeys.VikunjaApiToken);
        var excludedTags = ParseExcludedIngredientTags(Value(AppSettingKeys.GroceryExportDefaultExcludedIngredientTags));
        var kassalappBaseUrl = Value(AppSettingKeys.KassalappBaseUrl) ?? "https://kassal.app/api/v1";
        var kassalappApiKey = Value(AppSettingKeys.KassalappApiKey);
        var helsedirektoratetBaseUrl = Value(AppSettingKeys.HelsedirektoratetBaseUrl) ?? "https://api.helsedirektoratet.no";
        var helsedirektoratetSubscriptionKey = Value(AppSettingKeys.HelsedirektoratetSubscriptionKey);

        return new AppSettingsDto(
            new ShoppingListExportSettingsDto(
                provider,
                NormalizeTaskMode(taskMode),
                new VikunjaSettingsDto(
                    baseUrl,
                    int.TryParse(projectIdValue, out var projectId) ? projectId : null,
                    !string.IsNullOrWhiteSpace(apiToken)
                ),
                excludedTags
            ),
            new ExternalIntegrationSettingsDto(
                new KassalappSettingsDto(
                    kassalappBaseUrl,
                    !string.IsNullOrWhiteSpace(kassalappApiKey)
                ),
                new HelsedirektoratetSettingsDto(
                    helsedirektoratetBaseUrl,
                    !string.IsNullOrWhiteSpace(helsedirektoratetSubscriptionKey)
                )
            ),
            new SystemInfoDto(
                environment.EnvironmentName,
                "SQLite",
                imageStorage.RootPath
            )
        );
    }

    public async Task<AppSettingsDto> UpdateAsync(UpdateAppSettingsRequest request, CancellationToken cancellationToken)
    {
        await SetValueAsync(AppSettingKeys.ExportProvider, NormalizeProvider(request.ShoppingListExport.Provider), cancellationToken);
        await SetValueAsync(AppSettingKeys.ExportTaskMode, NormalizeTaskMode(request.ShoppingListExport.TaskMode), cancellationToken);
        await SetValueAsync(AppSettingKeys.VikunjaBaseUrl, request.ShoppingListExport.Vikunja.BaseUrl.Trim(), cancellationToken);
        await SetValueAsync(AppSettingKeys.VikunjaProjectId, request.ShoppingListExport.Vikunja.ProjectId?.ToString(), cancellationToken);

        if (request.ShoppingListExport.Vikunja.ApiToken is not null)
        {
            await SetValueAsync(AppSettingKeys.VikunjaApiToken, request.ShoppingListExport.Vikunja.ApiToken.Trim(), cancellationToken);
        }

        await SetValueAsync(AppSettingKeys.KassalappBaseUrl, request.ExternalIntegrations.Kassalapp.BaseUrl.Trim(), cancellationToken);
        if (request.ExternalIntegrations.Kassalapp.ApiKey is not null)
        {
            await SetValueAsync(AppSettingKeys.KassalappApiKey, request.ExternalIntegrations.Kassalapp.ApiKey.Trim(), cancellationToken);
        }

        await SetValueAsync(AppSettingKeys.HelsedirektoratetBaseUrl, request.ExternalIntegrations.Helsedirektoratet.BaseUrl.Trim(), cancellationToken);
        if (request.ExternalIntegrations.Helsedirektoratet.SubscriptionKey is not null)
        {
            await SetValueAsync(AppSettingKeys.HelsedirektoratetSubscriptionKey, request.ExternalIntegrations.Helsedirektoratet.SubscriptionKey.Trim(), cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        return await GetAsync(cancellationToken);
    }

    public async Task<AppSettingsDto> UpdateGroceryExportRulesAsync(
        UpdateGroceryExportRulesRequest request,
        CancellationToken cancellationToken
    )
    {
        await SetValueAsync(
            AppSettingKeys.GroceryExportDefaultExcludedIngredientTags,
            string.Join(",", NormalizeTags(request.DefaultExcludedIngredientTags)),
            cancellationToken
        );
        await context.SaveChangesAsync(cancellationToken);

        return await GetAsync(cancellationToken);
    }

    /// <summary>The first problem with shopping list export settings, or null.</summary>
    public static string? Validate(UpdateShoppingListExportSettingsRequest request)
    {
        if (!string.Equals(request.Provider, "Vikunja", StringComparison.OrdinalIgnoreCase))
        {
            return "Only Vikunja is supported right now.";
        }

        if (!string.Equals(request.TaskMode, ExportTaskModes.SingleTask, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(request.TaskMode, ExportTaskModes.SeparateTasks, StringComparison.OrdinalIgnoreCase))
        {
            return "Shopping list task mode is not supported.";
        }

        if (!string.IsNullOrWhiteSpace(request.Vikunja.BaseUrl)
            && !Uri.TryCreate(request.Vikunja.BaseUrl, UriKind.Absolute, out _))
        {
            return "Vikunja base URL must be an absolute URL.";
        }

        return request.Vikunja.ProjectId is <= 0
            ? "Vikunja project ID must be a positive number."
            : null;
    }

    /// <summary>The first problem with the external integration settings, or null.</summary>
    public static string? Validate(UpdateExternalIntegrationSettingsRequest request)
    {
        if (ValidateKassalappBaseUrl(request.Kassalapp.BaseUrl) is { } error)
        {
            return error;
        }

        return !IsBlankOrAbsoluteUrl(request.Helsedirektoratet.BaseUrl)
            ? "Helsedirektoratet base URL must be an absolute URL."
            : null;
    }

    public static string? ValidateKassalappBaseUrl(string? baseUrl) =>
        IsBlankOrAbsoluteUrl(baseUrl) ? null : "Kassalapp base URL must be an absolute URL.";

    private static bool IsBlankOrAbsoluteUrl(string? value) =>
        string.IsNullOrWhiteSpace(value) || Uri.TryCreate(value, UriKind.Absolute, out _);

    public async Task<string?> GetValueAsync(string key, CancellationToken cancellationToken)
    {
        var storedValue = await context.AppSettings
            .AsNoTracking()
            .Where(setting => setting.Key == key)
            .Select(setting => setting.Value)
            .FirstOrDefaultAsync(cancellationToken);

        return storedValue ?? configuration[key];
    }

    public async Task SetNutritionProfileIdAsync(string? profileId, CancellationToken cancellationToken)
    {
        await SetValueAsync(AppSettingKeys.NutritionProfileId, profileId, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> GetNutritionPeopleEatingAsync(CancellationToken cancellationToken)
    {
        var storedValue = await GetValueAsync(AppSettingKeys.NutritionPeopleEating, cancellationToken);
        return int.TryParse(storedValue, out var peopleEating) && peopleEating >= 1
            ? peopleEating
            : 1;
    }

    public async Task SetNutritionPreferenceAsync(
        string? profileId,
        int peopleEating,
        CancellationToken cancellationToken
    )
    {
        await SetValueAsync(AppSettingKeys.NutritionProfileId, profileId, cancellationToken);
        await SetValueAsync(AppSettingKeys.NutritionPeopleEating, Math.Max(1, peopleEating).ToString(), cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task SetValueAsync(string key, string? value, CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings.FindAsync([key], cancellationToken);

        if (setting is null)
        {
            setting = new AppSetting
            {
                Key = key
            };
            context.AppSettings.Add(setting);
        }

        setting.Value = string.IsNullOrWhiteSpace(value) ? null : value;
        setting.UpdatedAt = DateTimeOffset.UtcNow;
    }

    private static string NormalizeProvider(string provider) =>
        string.Equals(provider, "Vikunja", StringComparison.OrdinalIgnoreCase) ? "Vikunja" : provider.Trim();

    private static string NormalizeTaskMode(string? taskMode) =>
        string.Equals(taskMode, ExportTaskModes.SeparateTasks, StringComparison.OrdinalIgnoreCase)
            ? ExportTaskModes.SeparateTasks
            : ExportTaskModes.SingleTask;

    private static IReadOnlyCollection<string> ParseExcludedIngredientTags(string? storedValue)
    {
        return string.IsNullOrWhiteSpace(storedValue)
            ? ["Spice"]
            : NormalizeTags(storedValue.Split(",", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    private static IReadOnlyCollection<string> NormalizeTags(IEnumerable<string>? tags) =>
        tags is null
            ? []
            : tags
                .Select(tag => tag.Trim())
                .Where(tag => tag.Length > 0 && tag.Length <= 64)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Order(StringComparer.OrdinalIgnoreCase)
                .ToList();
}

public static class AppSettingKeys
{
    public const string ExportProvider = "ShoppingListExport:Provider";
    public const string ExportTaskMode = "ShoppingListExport:TaskMode";
    public const string VikunjaBaseUrl = "Vikunja:BaseUrl";
    public const string VikunjaApiToken = "Vikunja:ApiToken";
    public const string VikunjaProjectId = "Vikunja:ProjectId";
    public const string KassalappBaseUrl = "Kassalapp:BaseUrl";
    public const string KassalappApiKey = "Kassalapp:ApiKey";
    public const string HelsedirektoratetBaseUrl = "Helsedirektoratet:BaseUrl";
    public const string HelsedirektoratetSubscriptionKey = "Helsedirektoratet:SubscriptionKey";
    public const string NutritionProfileId = "Nutrition:ProfileId";
    public const string NutritionPeopleEating = "Nutrition:PeopleEating";
    public const string GroceryExportDefaultExcludedIngredientTags = "GroceryExport:DefaultExcludedIngredientTags";
    public const string PlanningPreferences = "Planning:Preferences";
}

public static class ExportTaskModes
{
    public const string SingleTask = "SingleTask";
    public const string SeparateTasks = "SeparateTasks";
}
