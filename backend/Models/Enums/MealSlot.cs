// MATFLOTE: Enum used by persisted MATFLOTE data and API contracts for MealSlot values.
// Note: Renaming or removing enum members needs care because SQLite stores many of these values as strings.

namespace DinnerPlanner.Api.Models;

public enum MealSlot
{
    Breakfast,
    Lunch,
    Dinner,
    Snack1,
    Snack2
}
