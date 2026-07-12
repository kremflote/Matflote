using DinnerPlanner.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record GroceryListDto(
    DateOnly From,
    DateOnly To,
    DateTimeOffset GeneratedAt,
    IReadOnlyCollection<GroceryListSectionDto> Sections
);

public record GroceryListSectionDto(
    string Name,
    IReadOnlyCollection<GroceryListItemDto> Items
);

public record GroceryListItemDto(
    int IngredientId,
    string IngredientName,
    decimal? Amount,
    MeasurementUnit Unit,
    bool IsApproximate,
    string DisplayAmount,
    IReadOnlyCollection<string> SourceRecipes
);

public record ShoppingListExportResultDto(
    string Provider,
    string ExternalId,
    string? ExternalUrl,
    string Message
);

public record GroceryListExportRequest(
    [Required] GroceryListDto GroceryList
);
