using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Services;

public class VikunjaOptionsResolver(AppSettingsService appSettingsService)
{
    public async Task<VikunjaOptions> ResolveSavedAsync(CancellationToken cancellationToken)
    {
        var baseUrl = await appSettingsService.GetValueAsync(AppSettingKeys.VikunjaBaseUrl, cancellationToken);
        var apiToken = await appSettingsService.GetValueAsync(AppSettingKeys.VikunjaApiToken, cancellationToken);
        var projectIdValue = await appSettingsService.GetValueAsync(AppSettingKeys.VikunjaProjectId, cancellationToken);

        return Resolve(baseUrl, apiToken, projectIdValue);
    }

    public async Task<VikunjaOptions> ResolveForTestAsync(
        UpdateShoppingListExportSettingsRequest request,
        CancellationToken cancellationToken
    )
    {
        var apiToken = string.IsNullOrWhiteSpace(request.Vikunja.ApiToken)
            ? await appSettingsService.GetValueAsync(AppSettingKeys.VikunjaApiToken, cancellationToken)
            : request.Vikunja.ApiToken;

        return Resolve(
            request.Vikunja.BaseUrl,
            apiToken,
            request.Vikunja.ProjectId?.ToString()
        );
    }

    private static VikunjaOptions Resolve(string? baseUrl, string? apiToken, string? projectIdValue)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new ShoppingListExportConfigurationException("Vikunja base URL is not configured.");
        }

        if (!Uri.TryCreate($"{baseUrl.TrimEnd('/')}/", UriKind.Absolute, out var baseUri))
        {
            throw new ShoppingListExportConfigurationException("Vikunja base URL must be an absolute URL.");
        }

        if (string.IsNullOrWhiteSpace(apiToken))
        {
            throw new ShoppingListExportConfigurationException("Vikunja API token is not configured.");
        }

        if (!int.TryParse(projectIdValue, out var projectId) || projectId <= 0)
        {
            throw new ShoppingListExportConfigurationException("Vikunja project ID must be a positive number.");
        }

        return new VikunjaOptions(baseUri, apiToken, projectId);
    }
}

public record VikunjaOptions(
    Uri BaseUri,
    string ApiToken,
    int ProjectId
);
