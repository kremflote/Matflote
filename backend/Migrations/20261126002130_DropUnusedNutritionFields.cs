using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <summary>
    /// Drops three ingredient nutrition columns the app no longer reads or shows (AUDIT C3): the vitamin list (a name
    /// list the web app derived from the vitamin amounts) and vitamin K and choline. SQLite rebuilds the Ingredients
    /// table to do it; every other column and row is copied as it is. The automatic copy taken before migrating keeps
    /// the old values.
    /// </summary>
    public partial class DropUnusedNutritionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NutritionPer100_CholineMilligrams",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "NutritionPer100_VitaminKMicrograms",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "NutritionPer100_Vitamins",
                table: "Ingredients");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "NutritionPer100_CholineMilligrams",
                table: "Ingredients",
                type: "TEXT",
                precision: 8,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "NutritionPer100_VitaminKMicrograms",
                table: "Ingredients",
                type: "TEXT",
                precision: 8,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NutritionPer100_Vitamins",
                table: "Ingredients",
                type: "TEXT",
                nullable: true);
        }
    }
}
