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
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
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
