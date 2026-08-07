using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTagCategoryVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShowForIngredients",
                table: "IngredientTagCategories",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowForRecipes",
                table: "IngredientTagCategories",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.UpdateData(
                table: "IngredientTagCategories",
                keyColumn: "IngredientTagCategoryId",
                keyValue: 1,
                columns: new[] { "ShowForIngredients", "ShowForRecipes" },
                values: new object[] { true, true });

            migrationBuilder.UpdateData(
                table: "IngredientTagCategories",
                keyColumn: "IngredientTagCategoryId",
                keyValue: 2,
                columns: new[] { "ShowForIngredients", "ShowForRecipes" },
                values: new object[] { true, true });

            migrationBuilder.UpdateData(
                table: "IngredientTagCategories",
                keyColumn: "IngredientTagCategoryId",
                keyValue: 3,
                columns: new[] { "ShowForIngredients", "ShowForRecipes" },
                values: new object[] { true, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowForIngredients",
                table: "IngredientTagCategories");

            migrationBuilder.DropColumn(
                name: "ShowForRecipes",
                table: "IngredientTagCategories");
        }
    }
}
