using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Services;

public class ShoppingListExportService(
    AppSettingsService appSettingsService,
    IEnumerable<IShoppingListExporter> exporters
)
{
    public async Task<ShoppingListExportResultDto> ExportAsync(GroceryListDto groceryList, CancellationToken cancellationToken)
    {
        var provider = await appSettingsService.GetValueAsync(AppSettingKeys.ExportProvider, cancellationToken);

        if (string.IsNullOrWhiteSpace(provider))
        {
            throw new ShoppingListExportConfigurationException("Shopping list export provider is not configured.");
        }

        var exporter = exporters.FirstOrDefault(candidate =>
            string.Equals(candidate.ProviderName, provider, StringComparison.OrdinalIgnoreCase));

        if (exporter is null)
        {
            throw new ShoppingListExportConfigurationException($"Shopping list export provider '{provider}' is not supported.");
        }

        return await exporter.ExportAsync(groceryList, cancellationToken);
    }
}
