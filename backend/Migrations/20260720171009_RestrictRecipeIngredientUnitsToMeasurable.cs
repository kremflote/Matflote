using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RestrictRecipeIngredientUnitsToMeasurable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE RecipeIngredients
                SET Unit = 'Gram'
                WHERE Unit IN ('Teaspoon', 'Tablespoon', 'Cup', 'Piece', 'Clove', 'Pinch', 'ToTaste')
                """
            );

            migrationBuilder.UpdateData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyValue: 2,
                columns: new[] { "Amount", "Unit" },
                values: new object[] { 3m, "Gram" });

            migrationBuilder.UpdateData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyValue: 3,
                columns: new[] { "Amount", "Unit" },
                values: new object[] { 30m, "Gram" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyValue: 2,
                columns: new[] { "Amount", "Unit" },
                values: new object[] { 1m, "Clove" });

            migrationBuilder.UpdateData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyValue: 3,
                columns: new[] { "Amount", "Unit" },
                values: new object[] { 0.5m, "Piece" });
        }
    }
}
