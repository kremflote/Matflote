// MATFLOTE: Request/response contracts for the assistant API, the name-based surface meant for AI agents and scripts.
// Note: Requests reject unknown JSON properties so a misspelled field comes back as an error instead of being silently ignored.

using DinnerPlanner.Api.Models;
using System.Text.Json.Serialization;

namespace DinnerPlanner.Api.Dtos;

// ---------- Context (read) ----------

public record AssistantContextDto(
    DateOnly ServerDate,
    DateOnly WeekStart,
    int HistoryDays,
    PlanningPreferencesDto PlanningPreferences,
    AssistantVocabularyDto Vocabulary,
    IReadOnlyCollection<AssistantTagCategoryDto> TagCategories,
    IReadOnlyCollection<AssistantConversionRuleDto> ConversionRules,
    IReadOnlyCollection<AssistantIngredientSummaryDto> Ingredients,
    IReadOnlyCollection<AssistantRecipeSummaryDto> Recipes
);

public record AssistantVocabularyDto(
    IReadOnlyCollection<string> Units,
    IReadOnlyDictionary<string, string> UnitAliases,
    IReadOnlyCollection<string> Preparations,
    IReadOnlyCollection<string> MealSlots,
    IReadOnlyCollection<string> MealRoles,
    AssistantLimitsDto Limits
);

public record AssistantLimitsDto(
    int RecipeNameMaxLength,
    int IngredientNameMaxLength,
    int DescriptionMaxLength,
    int MealNotesMaxLength
);

public record AssistantTagCategoryDto(
    string Category,
    bool ForIngredients,
    bool ForRecipes,
    IReadOnlyCollection<string> Tags
);

public record AssistantConversionRuleDto(
    string From,
    string To
);

public record AssistantIngredientSummaryDto(
    int Id,
    string Name,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Brand,
    IReadOnlyCollection<string> Tags,
    bool HasNutrition
);

public record AssistantRecipeSummaryDto(
    int Id,
    string Name,
    decimal Portions,
    IReadOnlyCollection<string> Tags,
    IReadOnlyCollection<string> Ingredients,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] IReadOnlyCollection<string>? Components,
    int PlannedCount,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] DateOnly? LastPlanned,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] DateOnly? NextPlanned,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? Rating,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? RatingNote
);

// ---------- Recipes (read one, write many) ----------

/// <summary>
/// A recipe in the same shape the import accepts, so it can be read, edited and posted back.
/// </summary>
public record AssistantRecipeDocumentDto(
    int Id,
    string Name,
    string? Description,
    string? Instructions,
    // The stored photo (/images/...), omitted when there is none. Posting it back keeps the photo.
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? ImageUrl,
    decimal Portions,
    IReadOnlyCollection<string> Tags,
    IReadOnlyCollection<AssistantRecipeIngredientDocumentDto> Ingredients,
    IReadOnlyCollection<AssistantRecipeComponentDocumentDto> Components
);

public record AssistantRecipeIngredientDocumentDto(
    string Name,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Brand,
    decimal? Amount,
    string Unit,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Preparation
);

public record AssistantRecipeComponentDocumentDto(
    string Recipe,
    decimal Amount,
    string Unit,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Preparation
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantImportRequest(
    bool? DryRun,
    string? OnExistingRecipe,
    string? OnExistingIngredient,
    bool? CreateMissingIngredients,
    bool? LookupNutrition,
    IReadOnlyCollection<AssistantIngredientInput>? Ingredients,
    IReadOnlyCollection<AssistantRecipeInput>? Recipes
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantIngredientInput(
    string? Name,
    string? Brand,
    string? Description,
    IReadOnlyCollection<string>? Tags,
    AssistantNutritionInput? NutritionPer100,
    string? Color
);

/// <summary>
/// Nutrition per 100 g or 100 ml. A separate type from <see cref="NutritionFacts"/> so that a misspelled
/// nutrient is rejected like any other unknown field, and so calories may be sent with decimals.
/// </summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantNutritionInput(
    decimal? Calories,
    decimal? CarbohydrateGrams,
    decimal? ProteinGrams,
    decimal? FatGrams,
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
    decimal? VitaminEMilligrams
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantRecipeInput(
    int? Id,
    string? Name,
    string? Description,
    string? Instructions,
    string? ImageUrl,
    decimal? Portions,
    IReadOnlyCollection<string>? Tags,
    IReadOnlyCollection<AssistantRecipeIngredientInput>? Ingredients,
    IReadOnlyCollection<AssistantRecipeComponentInput>? Components
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantRecipeIngredientInput(
    string? Name,
    string? Brand,
    decimal? Amount,
    string? Unit,
    string? Preparation
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantRecipeComponentInput(
    string? Recipe,
    decimal? Amount,
    string? Unit,
    string? Preparation
);

public record AssistantImportResultDto(
    bool DryRun,
    bool Applied,
    IReadOnlyCollection<string> Errors,
    IReadOnlyCollection<AssistantItemResultDto> Ingredients,
    IReadOnlyCollection<AssistantItemResultDto> Recipes
);

public record AssistantItemResultDto(
    string Name,
    string Status,
    int? Id,
    IReadOnlyCollection<string> Warnings,
    IReadOnlyCollection<string> Errors,
    // For recipes: the stored photo when this request set a new one (a downloaded image gets its own /images/... path).
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? ImageUrl,
    // Set when "lookupNutrition" attached (or, in a dry run, would attach) Matvaretabellen values to a new ingredient.
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] AssistantNutritionMatchDto? NutritionMatch
);

public record AssistantNutritionMatchDto(
    string FoodId,
    string FoodName,
    decimal Confidence,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Url
);

// ---------- Meal plan (read range, write many) ----------

public record AssistantMealPlanDto(
    DateOnly From,
    DateOnly To,
    IReadOnlyCollection<AssistantMealPlanEntryDto> Entries
);

public record AssistantMealPlanEntryDto(
    DateOnly Date,
    string Weekday,
    string Slot,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Notes,
    IReadOnlyCollection<AssistantMealPlanItemDto> Items
);

public record AssistantMealPlanItemDto(
    string Role,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Recipe,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] int? RecipeId,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] decimal? Portions,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Ingredient,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] decimal? Amount,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Unit
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantMealPlanRequest(
    bool? DryRun,
    string? Mode,
    AssistantDateRangeInput? ClearRange,
    IReadOnlyCollection<AssistantMealPlanEntryInput>? Entries
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantDateRangeInput(
    DateOnly? From,
    DateOnly? To
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantMealPlanEntryInput(
    DateOnly? Date,
    string? Slot,
    string? Notes,
    IReadOnlyCollection<AssistantMealPlanItemInput>? Items
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantMealPlanItemInput(
    string? Recipe,
    int? RecipeId,
    decimal? Portions,
    string? Ingredient,
    string? Brand,
    decimal? Amount,
    string? Unit,
    string? Role
);

public record AssistantMealPlanResultDto(
    bool DryRun,
    bool Applied,
    IReadOnlyCollection<string> Errors,
    IReadOnlyCollection<AssistantMealPlanEntryResultDto> Entries
);

public record AssistantMealPlanEntryResultDto(
    // Null only for an entry that was sent without a date (and so has an error).
    DateOnly? Date,
    string Slot,
    string Status,
    IReadOnlyCollection<string> Items,
    IReadOnlyCollection<string> Warnings,
    IReadOnlyCollection<string> Errors
);

// ---------- Write log and undo ----------

public record AssistantWriteLogDto(
    int Id,
    DateTimeOffset At,
    string Endpoint,
    string Summary,
    IReadOnlyDictionary<string, int> Counts,
    // A meal plan write that has not been undone.
    bool CanUndo,
    // The write that POST /api/assistant/meal-plan/undo would undo now.
    bool IsNextUndo,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] DateTimeOffset? UndoneAt,
    // For meal plan writes: the first and last date it changed.
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] DateOnly? From,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] DateOnly? To
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantUndoRequest(
    bool? DryRun,
    bool? Force
);

public record AssistantUndoResultDto(
    bool DryRun,
    bool Applied,
    int? UndoneWriteId,
    string? UndoneWriteSummary,
    DateTimeOffset? UndoneWriteAt,
    IReadOnlyCollection<string> Errors,
    IReadOnlyCollection<AssistantUndoSlotDto> Slots
);

public record AssistantUndoSlotDto(
    DateOnly Date,
    string Slot,
    string Status,
    IReadOnlyCollection<string> Items,
    IReadOnlyCollection<string> Warnings
);
