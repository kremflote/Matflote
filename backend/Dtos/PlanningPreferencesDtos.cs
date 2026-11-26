// MATFLOTE: Request/response contract for the household's planning preferences.
// Note: The same shape is read by the Settings page, by the planner's "Generate week" and by agents through the assistant context.

namespace DinnerPlanner.Api.Dtos;

/// <summary>
/// How the household likes its week planned. <c>PeopleEating</c> is the same number as the Nutrition page's
/// "people eating" (one household size, stored once).
/// </summary>
public record PlanningPreferencesDto(
    int PeopleEating,
    int MinFishDinnersPerWeek,
    int MinChickenDinnersPerWeek,
    IReadOnlyCollection<string> AvoidTags,
    IReadOnlyCollection<string> AvoidIngredients,
    int RepeatAfterWeeks,
    string? Notes
);
