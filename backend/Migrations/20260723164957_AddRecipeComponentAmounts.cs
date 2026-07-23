using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeComponentAmounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "RecipeComponents",
                type: "TEXT",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 1m);

            migrationBuilder.AddColumn<string>(
                name: "Preparation",
                table: "RecipeComponents",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "RecipeComponents",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "Gram");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Amount",
                table: "RecipeComponents");

            migrationBuilder.DropColumn(
                name: "Preparation",
                table: "RecipeComponents");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "RecipeComponents");
        }
    }
}
