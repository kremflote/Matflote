using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddIngredientTagCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IngredientTagCategories",
                columns: table => new
                {
                    IngredientTagCategoryId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngredientTagCategories", x => x.IngredientTagCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "IngredientTagDefinitions",
                columns: table => new
                {
                    IngredientTagDefinitionId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    IngredientTagCategoryId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IngredientTagDefinitions", x => x.IngredientTagDefinitionId);
                    table.ForeignKey(
                        name: "FK_IngredientTagDefinitions_IngredientTagCategories_IngredientTagCategoryId",
                        column: x => x.IngredientTagCategoryId,
                        principalTable: "IngredientTagCategories",
                        principalColumn: "IngredientTagCategoryId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "IngredientTagCategories",
                columns: new[] { "IngredientTagCategoryId", "Name", "SortOrder" },
                values: new object[,]
                {
                    { 1, "Produce", 100 },
                    { 2, "Protein", 200 },
                    { 3, "Pantry", 300 }
                });

            migrationBuilder.InsertData(
                table: "IngredientTagDefinitions",
                columns: new[] { "IngredientTagDefinitionId", "IngredientTagCategoryId", "Name" },
                values: new object[,]
                {
                    { 1, 1, "Vegetable" },
                    { 2, 1, "Fruit" },
                    { 3, 1, "Berry" },
                    { 4, 1, "RootVegetable" },
                    { 5, 1, "LeafyGreen" },
                    { 6, 1, "Herb" },
                    { 7, 2, "Chicken" },
                    { 8, 2, "Fish" },
                    { 9, 2, "Beef" },
                    { 10, 2, "Lamb" },
                    { 11, 2, "Mince" },
                    { 12, 2, "Dairy" },
                    { 13, 3, "Grain" },
                    { 14, 3, "Bread" },
                    { 15, 3, "Spice" },
                    { 16, 3, "Sauce" },
                    { 17, 3, "Dip" },
                    { 18, 3, "Pantry" },
                    { 19, 3, "Frozen" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_IngredientTagCategories_Name",
                table: "IngredientTagCategories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IngredientTagDefinitions_IngredientTagCategoryId",
                table: "IngredientTagDefinitions",
                column: "IngredientTagCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_IngredientTagDefinitions_Name",
                table: "IngredientTagDefinitions",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IngredientTagDefinitions");

            migrationBuilder.DropTable(
                name: "IngredientTagCategories");
        }
    }
}
