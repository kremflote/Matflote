// MATFLOTE: Request/response contracts for IngredientPrice API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record StoreDto(
    int StoreId,
    string Name
);

public record IngredientPricePointRequest(
    [Required]
    int IngredientId,
    [Required]
    int StoreId,
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    decimal Price,
    DateOnly Date,
    [StringLength(500)]
    string? Note
);

public record IngredientPricePointDto(
    int IngredientPricePointId,
    int IngredientId,
    string IngredientName,
    StoreDto Store,
    decimal Price,
    DateOnly Date,
    string? Note
);

public record StorePriceSummaryDto(
    int StoreId,
    string StoreName,
    decimal LatestPrice,
    DateOnly LatestDate,
    int PricePointCount
);

public record IngredientPriceSummaryDto(
    int IngredientId,
    string IngredientName,
    decimal? LatestPrice,
    string? LatestStoreName,
    DateOnly? LatestDate,
    decimal? LowestPrice,
    string? LowestStoreName,
    DateOnly? LowestDate,
    decimal? AveragePrice,
    int PricePointCount,
    IReadOnlyCollection<StorePriceSummaryDto> Stores
);
