using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIngredientPriceTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Stores",
                columns: table => new
                {
                    StoreId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stores", x => x.StoreId);
                });

            migrationBuilder.CreateTable(
                name: "IngredientPricePoints",
                columns: table => new
                {
                    IngredientPricePointId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IngredientId = table.Column<int>(type: "INTEGER", nullable: false),
                    StoreId = table.Column<int>(type: "INTEGER", nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Note = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngredientPricePoints", x => x.IngredientPricePointId);
                    table.ForeignKey(
                        name: "FK_IngredientPricePoints_Ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "IngredientId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IngredientPricePoints_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "StoreId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IngredientPricePoints_IngredientId_Date",
                table: "IngredientPricePoints",
                columns: new[] { "IngredientId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_IngredientPricePoints_StoreId",
                table: "IngredientPricePoints",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Stores_Name",
                table: "Stores",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IngredientPricePoints");

            migrationBuilder.DropTable(
                name: "Stores");
        }
    }
}
