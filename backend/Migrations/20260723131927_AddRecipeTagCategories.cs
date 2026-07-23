using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeTagCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecipeTagCategories",
                columns: table => new
                {
                    RecipeTagCategoryId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeTagCategories", x => x.RecipeTagCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "RecipeTagDefinitions",
                columns: table => new
                {
                    RecipeTagDefinitionId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    RecipeTagCategoryId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeTagDefinitions", x => x.RecipeTagDefinitionId);
                    table.ForeignKey(
                        name: "FK_RecipeTagDefinitions_RecipeTagCategories_RecipeTagCategoryId",
                        column: x => x.RecipeTagCategoryId,
                        principalTable: "RecipeTagCategories",
                        principalColumn: "RecipeTagCategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "RecipeTagCategories",
                columns: new[] { "RecipeTagCategoryId", "Name", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Meal", 100 },
                    { 2, "Format", 200 },
                    { 3, "Style", 300 }
                });

            migrationBuilder.InsertData(
                table: "RecipeTagDefinitions",
                columns: new[] { "RecipeTagDefinitionId", "Name", "RecipeTagCategoryId" },
                values: new object[,]
                {
                    { 1, "Breakfast", 1 },
                    { 2, "Lunch", 1 },
                    { 3, "Dinner", 1 },
                    { 4, "Bowl", 2 },
                    { 5, "Plate", 2 },
                    { 6, "Porridge", 2 },
                    { 7, "Soup", 2 },
                    { 8, "Stew", 2 },
                    { 9, "Salad", 2 },
                    { 10, "Pizza", 2 },
                    { 11, "Sandwich", 2 },
                    { 12, "Casserole", 2 },
                    { 13, "Grill", 3 },
                    { 14, "Pasta", 3 },
                    { 15, "Vegetarian", 3 },
                    { 16, "SousVide", 3 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecipeTagCategories_Name",
                table: "RecipeTagCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecipeTagDefinitions_Name",
                table: "RecipeTagDefinitions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecipeTagDefinitions_RecipeTagCategoryId",
                table: "RecipeTagDefinitions",
                column: "RecipeTagCategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecipeTagDefinitions");

            migrationBuilder.DropTable(
                name: "RecipeTagCategories");
        }
    }
}
