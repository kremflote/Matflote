// MATFLOTE: Enum used by persisted MATFLOTE data and API contracts for IngredientTag values.
// Note: Renaming or removing enum members needs care because SQLite stores many of these values as strings.

namespace DinnerPlanner.Api.Models;

public enum IngredientTag
{
    Vegetable,
    Fruit,
    Chicken,
    Fish,
    Beef,
    Lamb,
    Mince,
    Dairy,
    Grain,
    Spice,
    Herb,
    Sauce,
    Pantry,
    Frozen,
    LeafyGreen,
    Berry,
    RootVegetable,
    Bread,
    Dip
}
