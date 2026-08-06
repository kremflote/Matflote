// MATFLOTE: Provider interface for sending generated grocery lists to an external todo system.
// Note: Keeping this tiny makes new todo providers possible without rewriting grocery-list generation.

using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Services;

public interface IShoppingListExporter
{
    string ProviderName { get; }
    Task<ShoppingListExportResultDto> ExportAsync(GroceryListDto groceryList, CancellationToken cancellationToken);
}
