using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTotalFatNutrition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            const string planningSourceUrl = "https://www.helsedirektoratet.no/rapporter/referanseverdier-for-energi-og-naeringsstoffer/anbefalinger-om-energi-og-naeringsstoffer-ved-planlegging-av-kosthold";

            migrationBuilder.AddColumn<decimal>(
                name: "NutritionPer100_FatGrams",
                table: "Ingredients",
                type: "TEXT",
                precision: 8,
                scale: 2,
                nullable: true);

            migrationBuilder.Sql("DELETE FROM NutritionReferenceValues WHERE NutrientKey IN ('vitaminK', 'choline')");
            migrationBuilder.Sql($"UPDATE NutritionReferenceProfiles SET SourceUrl = '{planningSourceUrl}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NutritionPer100_FatGrams",
                table: "Ingredients");
        }
    }
}
