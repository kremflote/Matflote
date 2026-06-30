using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Ingredients",
                columns: table => new
                {
                    IngredientId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IngredientName = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    Brand = table.Column<string>(type: "TEXT", nullable: true),
                    Price = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: true),
                    Amount = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: true),
                    Unit = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    NutritionPer100_Calories = table.Column<int>(type: "INTEGER", nullable: true),
                    NutritionPer100_Vitamins = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    NutritionPer100_DietaryFiberGrams = table.Column<decimal>(type: "TEXT", precision: 8, scale: 2, nullable: true),
                    Color = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ingredients", x => x.IngredientId);
                });

            migrationBuilder.CreateTable(
                name: "Recipes",
                columns: table => new
                {
                    RecipeId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Instructions = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recipes", x => x.RecipeId);
                });

            migrationBuilder.CreateTable(
                name: "KitchenItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    RecipeId = table.Column<int>(type: "INTEGER", nullable: true),
                    ItemType = table.Column<string>(type: "TEXT", maxLength: 13, nullable: false),
                    Dessert_Type = table.Column<string>(type: "TEXT", nullable: true),
                    Type = table.Column<string>(type: "TEXT", nullable: true),
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

            migrationBuilder.CreateTable(
                name: "RecipeIngredients",
                columns: table => new
                {
                    RecipeIngredientId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RecipeId = table.Column<int>(type: "INTEGER", nullable: false),
                    IngredientId = table.Column<int>(type: "INTEGER", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: true),
                    Unit = table.Column<string>(type: "TEXT", maxLength: 40, nullable: true),
                    Preparation = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeIngredients", x => x.RecipeIngredientId);
                    table.ForeignKey(
                        name: "FK_RecipeIngredients_Ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "IngredientId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecipeIngredients_Recipes_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "Recipes",
                        principalColumn: "RecipeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Ingredients",
                columns: new[] { "IngredientId", "Amount", "Brand", "Category", "Color", "IngredientName", "Price", "Unit" },
                values: new object[,]
                {
                    { 1, 1m, null, "Chicken", "#f6d4b8", "Chicken breast", 89.90m, "Kilogram" },
                    { 2, 1m, null, "Vegetable", "#f4ead2", "Garlic", 14.90m, "Piece" },
                    { 3, 500m, null, "Dairy", "#fff7ef", "Greek yogurt", 34.90m, "Gram" },
                    { 4, 1m, null, "Grain", "#f6f0df", "Rice", 39.90m, "Kilogram" },
                    { 5, 1m, null, "Fruit", "#f9dc5c", "Lemon", 8.90m, "Piece" }
                });

            migrationBuilder.InsertData(
                table: "KitchenItems",
                columns: new[] { "Id", "ImageUrl", "ItemType", "Name", "RecipeId" },
                values: new object[] { 3, null, "Side", "Steamed rice", null });

            migrationBuilder.InsertData(
                table: "Recipes",
                columns: new[] { "RecipeId", "Description", "ImageUrl", "Instructions", "Name" },
                values: new object[,]
                {
                    { 1, "Fresh yogurt sauce with garlic and lemon.", null, "Grate the garlic, stir it into yogurt with lemon, and season to taste.", "Garlic yogurt sauce" },
                    { 2, "Simple chicken bowl with rice and sauce.", null, "Cook rice. Fry chicken until done. Serve with garlic yogurt sauce.", "Chicken rice bowl" }
                });

            migrationBuilder.InsertData(
                table: "KitchenItems",
                columns: new[] { "Id", "ImageUrl", "ItemType", "Name", "RecipeId" },
                values: new object[] { 1, null, "Sauce", "Garlic yogurt sauce", 1 });

            migrationBuilder.InsertData(
                table: "KitchenItems",
                columns: new[] { "Id", "Cuisine", "ImageUrl", "ItemType", "Name", "RecipeId", "Type" },
                values: new object[] { 2, "Asian", null, "Dish", "Chicken rice bowl", 2, "Bowl" });

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
                name: "IX_KitchenItems_RecipeId",
                table: "KitchenItems",
                column: "RecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeIngredients_IngredientId",
                table: "RecipeIngredients",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeIngredients_RecipeId",
                table: "RecipeIngredients",
                column: "RecipeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KitchenItems");

            migrationBuilder.DropTable(
                name: "RecipeIngredients");

            migrationBuilder.DropTable(
                name: "Ingredients");

            migrationBuilder.DropTable(
                name: "Recipes");
        }
    }
}
