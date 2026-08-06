// MATFLOTE: Enum used by persisted MATFLOTE data and API contracts for IngredientPreparation values.
// Note: Renaming or removing enum members needs care because SQLite stores many of these values as strings.

namespace DinnerPlanner.Api.Models;

public enum IngredientPreparation
{
    None,
    Quartered,
    Wedged,
    Chopped,
    RoughlyChopped,
    FinelyChopped,
    Diced,
    Cubed,
    Julienned,
    Batons,
    Sliced,
    Minced,
    Grated,
    Shredded,
    Crushed
}
