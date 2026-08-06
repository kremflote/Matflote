// MATFLOTE: Enum used by persisted MATFLOTE data and API contracts for Vitamin values.
// Note: Renaming or removing enum members needs care because SQLite stores many of these values as strings.

namespace DinnerPlanner.Api.Models;

public enum Vitamin
{
    VitaminA,
    VitaminB9,
    VitaminB12,
    VitaminC,
    VitaminD,
    VitaminE,
    VitaminK,
    Choline
}
