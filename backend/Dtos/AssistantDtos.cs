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
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] DateOnly? LastPlanned
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
    IReadOnlyCollection<AssistantIngredientInput>? Ingredients,
    IReadOnlyCollection<AssistantRecipeInput>? Recipes
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantIngredientInput(
    string? Name,
    string? Brand,
    string? Description,
    IReadOnlyCollection<string>? Tags,
    NutritionFacts? NutritionPer100,
    string? Color
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantRecipeInput(
    int? Id,
    string? Name,
    string? Description,
    string? Instructions,
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
    IReadOnlyCollection<string> Errors
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
    DateOnly From,
    DateOnly To
);

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public record AssistantMealPlanEntryInput(
    DateOnly Date,
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
    DateOnly Date,
    string Slot,
    string Status,
    IReadOnlyCollection<string> Items,
    IReadOnlyCollection<string> Warnings,
    IReadOnlyCollection<string> Errors
);
