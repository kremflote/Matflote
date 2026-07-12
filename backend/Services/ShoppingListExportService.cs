using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Services;

public class ShoppingListExportService(
    IConfiguration configuration,
    IEnumerable<IShoppingListExporter> exporters
)
{
    public Task<ShoppingListExportResultDto> ExportAsync(GroceryListDto groceryList, CancellationToken cancellationToken)
    {
        var provider = configuration["ShoppingListExport:Provider"];

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

        return exporter.ExportAsync(groceryList, cancellationToken);
    }
}
