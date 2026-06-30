using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RecipeInheritanceRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DishTypeAssignments_KitchenItems_DishId",
                table: "DishTypeAssignments");

            migrationBuilder.DropTable(
                name: "KitchenItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RecipeIngredients",
                table: "RecipeIngredients");

            migrationBuilder.DropIndex(
                name: "IX_RecipeIngredients_RecipeId",
                table: "RecipeIngredients");

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyColumnType: "INTEGER",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyColumnType: "INTEGER",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyColumnType: "INTEGER",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyColumnType: "INTEGER",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumn: "RecipeIngredientId",
                keyColumnType: "INTEGER",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Recipes",
                keyColumn: "RecipeId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Recipes",
                keyColumn: "RecipeId",
                keyValue: 2);

            migrationBuilder.DropColumn(
                name: "RecipeIngredientId",
                table: "RecipeIngredients");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "RecipeIngredients");

            migrationBuilder.DropColumn(
                name: "Preparation",
                table: "RecipeIngredients");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "RecipeIngredients");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Recipes",
                type: "TEXT",
                maxLength: 600,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddColumn<string>(
                name: "Cuisine",
                table: "Recipes",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecipeType",
                table: "Recipes",
                type: "TEXT",
                maxLength: 8,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Recipes",
                type: "TEXT",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_RecipeIngredients",
                table: "RecipeIngredients",
                columns: new[] { "RecipeId", "IngredientId" });

            migrationBuilder.InsertData(
                table: "Recipes",
                columns: new[] { "RecipeId", "Description", "ImageUrl", "Instructions", "Name", "RecipeType" },
                values: new object[] { 1, "Fresh yogurt sauce with garlic and lemon.", null, "Grate the garlic, stir it into yogurt with lemon, and season to taste.", "Garlic yogurt sauce", "Sauce" });

            migrationBuilder.InsertData(
                table: "Recipes",
                columns: new[] { "RecipeId", "Cuisine", "Description", "ImageUrl", "Instructions", "Name", "RecipeType" },
                values: new object[] { 2, "Asian", "Simple chicken bowl with rice and sauce.", null, "Cook rice. Fry chicken until done. Serve with garlic yogurt sauce.", "Chicken rice bowl", "Dish" });

            migrationBuilder.InsertData(
                table: "Recipes",
                columns: new[] { "RecipeId", "Description", "ImageUrl", "Instructions", "Name", "RecipeType" },
                values: new object[] { 3, "", null, "Rinse rice and steam until tender.", "Steamed rice", "Side" });

            migrationBuilder.InsertData(
                table: "RecipeIngredients",
                columns: new[] { "IngredientId", "RecipeId" },
                values: new object[,]
                {
                    { 2, 1 },
                    { 3, 1 },
                    { 5, 1 },
                    { 1, 2 },
                    { 4, 2 }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_DishTypeAssignments_Recipes_DishId",
                table: "DishTypeAssignments",
                column: "DishId",
                principalTable: "Recipes",
                principalColumn: "RecipeId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DishTypeAssignments_Recipes_DishId",
                table: "DishTypeAssignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RecipeIngredients",
                table: "RecipeIngredients");

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumns: new[] { "IngredientId", "RecipeId" },
                keyValues: new object[] { 2, 1 });

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumns: new[] { "IngredientId", "RecipeId" },
                keyValues: new object[] { 3, 1 });

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumns: new[] { "IngredientId", "RecipeId" },
                keyValues: new object[] { 5, 1 });

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumns: new[] { "IngredientId", "RecipeId" },
                keyValues: new object[] { 1, 2 });

            migrationBuilder.DeleteData(
                table: "RecipeIngredients",
                keyColumns: new[] { "IngredientId", "RecipeId" },
                keyValues: new object[] { 4, 2 });

            migrationBuilder.DeleteData(
                table: "Recipes",
                keyColumn: "RecipeId",
                keyValue: 3);

            migrationBuilder.DropColumn(
                name: "Cuisine",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "RecipeType",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Recipes");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Recipes",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 600,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecipeIngredientId",
                table: "RecipeIngredients",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0)
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "RecipeIngredients",
                type: "TEXT",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Preparation",
                table: "RecipeIngredients",
                type: "TEXT",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "RecipeIngredients",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_RecipeIngredients",
                table: "RecipeIngredients",
                column: "RecipeIngredientId");

            migrationBuilder.CreateTable(
                name: "KitchenItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RecipeId = table.Column<int>(type: "INTEGER", nullable: true),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    ItemType = table.Column<string>(type: "TEXT", maxLength: 13, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    Cuisine = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KitchenItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KitchenItems_Recipes_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "Recipes",
                        principalColumn: "RecipeId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "KitchenItems",
                columns: new[] { "Id", "ImageUrl", "ItemType", "Name", "RecipeId" },
                values: new object[] { 1, null, "Sauce", "Garlic yogurt sauce", 1 });

            migrationBuilder.InsertData(
                table: "KitchenItems",
                columns: new[] { "Id", "Cuisine", "ImageUrl", "ItemType", "Name", "RecipeId" },
                values: new object[] { 2, "Asian", null, "Dish", "Chicken rice bowl", 2 });

            migrationBuilder.InsertData(
                table: "KitchenItems",
                columns: new[] { "Id", "ImageUrl", "ItemType", "Name", "RecipeId" },
                values: new object[] { 3, null, "Side", "Steamed rice", null });

            migrationBuilder.InsertData(
                table: "RecipeIngredients",
                columns: new[] { "RecipeIngredientId", "Amount", "IngredientId", "Preparation", "RecipeId", "Unit" },
                values: new object[,]
                {
                    { 1, 200m, 3, "Raw", 1, "Gram" },
                    { 2, 1m, 2, "Grated", 1, "Clove" },
                    { 3, 1m, 5, "Raw", 1, "Tablespoon" },
                    { 4, 200m, 1, "Fried", 2, "Gram" },
                    { 5, 100m, 4, "Boiled", 2, "Gram" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecipeIngredients_RecipeId",
                table: "RecipeIngredients",
                column: "RecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_KitchenItems_RecipeId",
                table: "KitchenItems",
                column: "RecipeId");

            migrationBuilder.AddForeignKey(
                name: "FK_DishTypeAssignments_KitchenItems_DishId",
                table: "DishTypeAssignments",
                column: "DishId",
                principalTable: "KitchenItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
