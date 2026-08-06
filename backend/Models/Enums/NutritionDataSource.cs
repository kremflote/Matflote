// MATFLOTE: Enum used by persisted MATFLOTE data and API contracts for NutritionDataSource values.
// Note: Renaming or removing enum members needs care because SQLite stores many of these values as strings.

namespace DinnerPlanner.Api.Models;

public enum NutritionDataSource
{
    None,
    Matvaretabellen,
    Kassalapp,
    Manual
}
