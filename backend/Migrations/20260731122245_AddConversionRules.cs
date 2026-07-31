using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddConversionRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConversionRules",
                columns: table => new
                {
                    ConversionRuleId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FromText = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    ToText = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    FromTextNb = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    ToTextNb = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversionRules", x => x.ConversionRuleId);
                });

            migrationBuilder.InsertData(
                table: "ConversionRules",
                columns: new[] { "ConversionRuleId", "CreatedAt", "FromText", "FromTextNb", "SortOrder", "ToText", "ToTextNb" },
                values: new object[,]
                {
                    { 1, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 tsp", "1 ts", 100, "5 ml / 5 g", "5 ml / 5 g" },
                    { 2, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 tbsp", "1 ss", 200, "15 ml / 15 g", "15 ml / 15 g" },
                    { 3, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 cup", "1 kopp", 300, "240 ml / 240 g", "240 ml / 240 g" },
                    { 4, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 yellow onion", "1 gul løk", 400, "170 g", "170 g" },
                    { 5, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 garlic clove", "1 hvitløksfedd", 500, "3 g", "3 g" },
                    { 6, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 carrot", "1 gulrot", 600, "70 g", "70 g" },
                    { 7, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 egg", "1 egg", 700, "60 g", "60 g" },
                    { 8, new DateTimeOffset(new DateTime(2026, 7, 31, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "1 broth cube", "1 kube med buljong", 800, "10 g", "10 g" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConversionRules_SortOrder",
                table: "ConversionRules",
                column: "SortOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConversionRules");
        }
    }
}
