using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <summary>
    /// Gives the tags that the shopping list, the prep helper and the meal picker look for a system key, so those
    /// features keep working when a tag is renamed (AUDIT B6, F15). Data only, and safe on any database:
    /// it never creates or deletes a tag. For each key it picks one existing tag that has no key yet and is named
    /// like the default (or a Norwegian name), preferring the default name and then the oldest tag. A key that is
    /// already in use, or has no such tag, is left alone. The tags stay ordinary tags: they can still be renamed,
    /// moved and deleted.
    /// </summary>
    public partial class AddBehaviourSystemKeys : Migration
    {
        // Key, then the names that identify the tag, the default first. Lower case: SQLite's lower() folds only A to Z,
        // which is enough because none of these starts with Æ, Ø or Å.
        private static readonly (string Key, string[] Names)[] Keys =
        [
            ("Produce.Vegetable", ["vegetable", "vegetables", "grønnsak", "grønnsaker"]),
            ("Produce.Fruit", ["fruit", "frukt"]),
            ("Produce.Berry", ["berry", "berries", "bær"]),
            ("Produce.RootVegetable", ["rootvegetable", "root vegetable", "rotgrønnsak", "rotgrønnsaker"]),
            ("Produce.LeafyGreen", ["leafygreen", "leafy green", "bladgrønnsak", "bladgrønnsaker", "bladgrønt"]),
            ("Produce.Herb", ["herb", "herbs", "urt", "urter", "krydderurt", "krydderurter"]),
            ("Food.Dairy", ["dairy", "meieri", "meieriprodukt", "meieriprodukter"]),
            ("Food.Grain", ["grain", "grains", "korn", "kornprodukt", "kornprodukter"]),
            ("Food.Spice", ["spice", "spices", "krydder"]),
            ("Storage.Frozen", ["frozen", "frossen", "fryst", "frysevare", "frysevarer"]),
            ("FoodRole.Sauce", ["sauce", "saus", "sauser"]),
            ("FoodRole.Dip", ["dip", "dipp"]),
            ("FoodRole.Side", ["side", "sides", "tilbehør"]),
            ("FoodRole.Salad", ["salad", "salat"]),
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var (key, names) in Keys)
            {
                var nameList = string.Join(", ", names.Select(name => $"'{name.Replace("'", "''")}'"));
                migrationBuilder.Sql($"""
                    UPDATE "IngredientTagDefinitions"
                    SET "SystemKey" = '{key}'
                    WHERE "IngredientTagDefinitionId" = (
                        SELECT "IngredientTagDefinitionId" FROM "IngredientTagDefinitions"
                        WHERE "SystemKey" IS NULL AND lower(trim("Name")) IN ({nameList})
                        ORDER BY lower(trim("Name")) = '{names[0]}' DESC, "IngredientTagDefinitionId"
                        LIMIT 1)
                    AND NOT EXISTS (SELECT 1 FROM "IngredientTagDefinitions" WHERE "SystemKey" = '{key}');
                    """);
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var keyList = string.Join(", ", Keys.Select(entry => $"'{entry.Key}'"));
            migrationBuilder.Sql($"""UPDATE "IngredientTagDefinitions" SET "SystemKey" = NULL WHERE "SystemKey" IN ({keyList});""");
        }
    }
}
