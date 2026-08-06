// MATFLOTE: Request/response contracts for Nutrition API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

namespace DinnerPlanner.Api.Dtos;

public record NutritionSummaryDto(
    DateOnly From,
    DateOnly To,
    NutritionProfileDto Profile,
    IReadOnlyCollection<NutritionProfileDto> Profiles,
    IReadOnlyCollection<DailyCaloriesDto> DailyCalories,
    IReadOnlyCollection<NutritionSummaryItemDto> Items,
    IReadOnlyCollection<MissingNutritionIngredientDto> MissingNutritionIngredients,
    NutritionReferenceSourceDto? ReferenceSource
);

public record DailyCaloriesDto(
    DateOnly Date,
    decimal? Calories
);

public record NutritionProfileDto(
    string ProfileId,
    string Label,
    string Gender,
    int MinAge,
    int? MaxAge
);

public record NutritionSummaryItemDto(
    string Key,
    string Label,
    decimal? Total,
    string Unit,
    decimal? RecommendedWeekly,
    decimal? PercentOfRecommended,
    decimal? CoveragePercent,
    string TargetType,
    string Status
);

public record NutritionReferenceSourceDto(
    string Provider,
    string SourceUrl,
    DateTimeOffset? SourceUpdatedAt,
    DateTimeOffset ImportedAt,
    string ValueType
);

public record MissingNutritionIngredientDto(
    int IngredientId,
    string IngredientName,
    string? BrandName,
    IReadOnlyCollection<string> SourceRecipes
);

public record NutritionPreferenceDto(
    string? ProfileId,
    int PeopleEating
);

public record NutritionReferenceImportResultDto(
    string Status,
    string Message,
    int ProfilesImported,
    DateTimeOffset ImportedAt
);
