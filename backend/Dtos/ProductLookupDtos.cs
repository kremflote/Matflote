namespace DinnerPlanner.Api.Dtos;

using DinnerPlanner.Api.Models;

public record ProductLookupResponseDto(
    string Ean,
    IReadOnlyCollection<ProductLookupResultDto> Products
);

public record ProductLookupResultDto(
    string Ean,
    string Name,
    string? Brand,
    string? Vendor,
    string? Description,
    string? Ingredients,
    string? ImageUrl,
    decimal? CurrentPrice,
    decimal? CurrentUnitPrice,
    decimal? Weight,
    string? WeightUnit,
    ProductLookupStoreDto? Store,
    string? KassalappUrl,
    ProductLookupNutritionDto? KassalappNutritionPer100,
    ProductLookupNutritionDto? MatvaretabellenNutritionPer100,
    ProductLookupNutritionDto? NutritionPer100,
    NutritionDataSource NutritionSource,
    NutritionDataSource? NutritionSupplementSource,
    bool MatvaretabellenSupplementAttempted,
    string MatvaretabellenSupplementStatus,
    IReadOnlyCollection<MatvaretabellenCandidateDto> MatvaretabellenCandidates,
    string? NutritionSourceLabel,
    string? MatvaretabellenFoodId,
    string? MatvaretabellenUrl,
    string? NutritionMatchedName,
    decimal? NutritionMatchConfidence,
    string Source
);

public record MatvaretabellenCandidateDto(
    string FoodId,
    string FoodName,
    string? Url,
    decimal Confidence,
    ProductLookupNutritionDto Nutrition
);

public record ProductLookupStoreDto(
    string Name,
    string? Url,
    string? Logo
);

public record ProductLookupNutritionDto(
    decimal? Calories,
    decimal? CarbohydrateGrams,
    decimal? ProteinGrams,
    decimal? SaltGrams,
    decimal? DietaryFiberGrams,
    decimal? SaturatedFatGrams,
    decimal? TransFatGrams,
    decimal? MonounsaturatedFatGrams,
    decimal? PolyunsaturatedFatGrams,
    decimal? Omega3Grams,
    decimal? Omega6Grams,
    decimal? CholesterolMilligrams,
    decimal? VitaminAMicrograms,
    decimal? VitaminB9Micrograms,
    decimal? VitaminB12Micrograms,
    decimal? VitaminCMilligrams,
    decimal? VitaminDMicrograms,
    decimal? VitaminEMilligrams,
    decimal? VitaminKMicrograms,
    decimal? CholineMilligrams
);
