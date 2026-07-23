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
        var provider = await GetValueAsync(AppSettingKeys.ExportProvider, cancellationToken) ?? "Vikunja";
        var taskMode = await GetValueAsync(AppSettingKeys.ExportTaskMode, cancellationToken) ?? ExportTaskModes.SingleTask;
        var baseUrl = await GetValueAsync(AppSettingKeys.VikunjaBaseUrl, cancellationToken) ?? string.Empty;
        var projectIdValue = await GetValueAsync(AppSettingKeys.VikunjaProjectId, cancellationToken);
        var apiToken = await GetValueAsync(AppSettingKeys.VikunjaApiToken, cancellationToken);
        var excludedTags = await GetDefaultExcludedIngredientTagsAsync(cancellationToken);

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

    private async Task<IReadOnlyCollection<string>> GetDefaultExcludedIngredientTagsAsync(CancellationToken cancellationToken)
    {
        var storedValue = await GetValueAsync(AppSettingKeys.GroceryExportDefaultExcludedIngredientTags, cancellationToken);
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
    public const string NutritionProfileId = "Nutrition:ProfileId";
    public const string GroceryExportDefaultExcludedIngredientTags = "GroceryExport:DefaultExcludedIngredientTags";
}

public static class ExportTaskModes
{
    public const string SingleTask = "SingleTask";
    public const string SeparateTasks = "SeparateTasks";
}
