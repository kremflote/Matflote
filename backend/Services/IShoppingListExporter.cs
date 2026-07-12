using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Services;

public interface IShoppingListExporter
{
    string ProviderName { get; }
    Task<ShoppingListExportResultDto> ExportAsync(GroceryListDto groceryList, CancellationToken cancellationToken);
}
