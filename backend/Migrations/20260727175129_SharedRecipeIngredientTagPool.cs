using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SharedRecipeIngredientTagPool : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM IngredientTagAssignments
                WHERE lower(Tag) = 'pantry';

                DELETE FROM IngredientTagDefinitions
                WHERE lower(Name) = 'pantry';
                """);

            migrationBuilder.Sql("""
                INSERT INTO IngredientTagCategories (Name, SortOrder)
                SELECT 'Meal', 400
                WHERE NOT EXISTS (
                    SELECT 1 FROM IngredientTagCategories WHERE lower(Name) = 'meal'
                );

                INSERT INTO IngredientTagCategories (Name, SortOrder)
                SELECT 'Format', 500
                WHERE NOT EXISTS (
                    SELECT 1 FROM IngredientTagCategories WHERE lower(Name) = 'format'
                );

                INSERT INTO IngredientTagCategories (Name, SortOrder)
                SELECT 'Style', 600
                WHERE NOT EXISTS (
                    SELECT 1 FROM IngredientTagCategories WHERE lower(Name) = 'style'
                );
                """);

            migrationBuilder.Sql("""
                INSERT INTO IngredientTagDefinitions (Name, IngredientTagCategoryId)
                SELECT value.Name, category.IngredientTagCategoryId
                FROM (
                    SELECT 'Breakfast' AS Name, 'Meal' AS CategoryName
                    UNION ALL SELECT 'Lunch', 'Meal'
                    UNION ALL SELECT 'Dinner', 'Meal'
                    UNION ALL SELECT 'Dish', 'Meal'
                    UNION ALL SELECT 'Side', 'Meal'
                    UNION ALL SELECT 'Dessert', 'Meal'
                    UNION ALL SELECT 'Bowl', 'Format'
                    UNION ALL SELECT 'Plate', 'Format'
                    UNION ALL SELECT 'Porridge', 'Format'
                    UNION ALL SELECT 'Soup', 'Format'
                    UNION ALL SELECT 'Stew', 'Format'
                    UNION ALL SELECT 'Salad', 'Format'
                    UNION ALL SELECT 'Pizza', 'Format'
                    UNION ALL SELECT 'Sandwich', 'Format'
                    UNION ALL SELECT 'Casserole', 'Format'
                    UNION ALL SELECT 'Grill', 'Style'
                    UNION ALL SELECT 'Pasta', 'Style'
                    UNION ALL SELECT 'Vegetarian', 'Style'
                    UNION ALL SELECT 'SousVide', 'Style'
                    UNION ALL SELECT 'SpiceMix', 'Pantry'
                ) value
                JOIN IngredientTagCategories category ON lower(category.Name) = lower(value.CategoryName)
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM IngredientTagDefinitions existing
                    WHERE lower(existing.Name) = lower(value.Name)
                );
                """);

            migrationBuilder.Sql("""
                INSERT INTO IngredientTagDefinitions (Name, IngredientTagCategoryId)
                SELECT recipeTag.Name,
                       CASE lower(recipeCategory.Name)
                           WHEN 'meal' THEN mealCategory.IngredientTagCategoryId
                           WHEN 'format' THEN formatCategory.IngredientTagCategoryId
                           ELSE styleCategory.IngredientTagCategoryId
                       END
                FROM RecipeTagDefinitions recipeTag
                JOIN RecipeTagCategories recipeCategory
                    ON recipeCategory.RecipeTagCategoryId = recipeTag.RecipeTagCategoryId
                JOIN IngredientTagCategories mealCategory ON lower(mealCategory.Name) = 'meal'
                JOIN IngredientTagCategories formatCategory ON lower(formatCategory.Name) = 'format'
                JOIN IngredientTagCategories styleCategory ON lower(styleCategory.Name) = 'style'
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM IngredientTagDefinitions existing
                    WHERE lower(existing.Name) = lower(recipeTag.Name)
                );
                """);

            migrationBuilder.Sql("""
                INSERT INTO RecipeTagAssignments (RecipeId, Tag)
                SELECT Recipes.RecipeId, Recipes.RecipeType
                FROM Recipes
                WHERE Recipes.RecipeType IS NOT NULL
                  AND length(trim(Recipes.RecipeType)) > 0
                  AND NOT EXISTS (
                      SELECT 1
                      FROM RecipeTagAssignments existing
                      WHERE existing.RecipeId = Recipes.RecipeId
                        AND lower(existing.Tag) = lower(Recipes.RecipeType)
                  );
                """);

            migrationBuilder.DropTable(
                name: "RecipeTagDefinitions");

            migrationBuilder.DropTable(
                name: "RecipeTagCategories");

            migrationBuilder.DropColumn(
                name: "RecipeType",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Recipes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Recipes",
                keyColumn: "RecipeId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Recipes",
                keyColumn: "RecipeId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Recipes",
                keyColumn: "RecipeId",
                keyValue: 3);

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
                    RecipeTagCategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false)
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
                table: "IngredientTagDefinitions",
                columns: new[] { "IngredientTagDefinitionId", "IngredientTagCategoryId", "Name" },
                values: new object[] { 18, 3, "Pantry" });

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
                table: "Recipes",
                columns: new[] { "RecipeId", "Description", "ImageUrl", "Instructions", "Name", "Portions", "RecipeType" },
                values: new object[,]
                {
                    { 1, "Cold yogurt sauce with grated garlic and lemon. Best with chicken bowls, grilled meat, roasted vegetables, and rice.", "/images/recipes/garlic-yogurt-sauce.png", "Grate the garlic finely. Stir garlic, lemon juice, and a little lemon zest into the yogurt. Season with salt and let it rest for at least 10 minutes before serving.", "Garlic yogurt sauce", 1m, "Sauce" },
                    { 2, "Weeknight bowl with pan-fried chicken, steamed rice, and fresh garlic yogurt sauce. Good as dinner and easy to scale for meal prep.", "/images/recipes/chicken-rice-bowl.png", "Rinse the rice and cook until tender. Slice the chicken breast, season lightly, and fry in a hot pan until cooked through. Spoon rice into bowls, add chicken, and finish with garlic yogurt sauce.", "Chicken rice bowl", 1m, "Dish" },
                    { 3, "Plain steamed rice for bowls, curries, stir fries, and saucy dishes.", null, "Rinse the rice until the water runs mostly clear. Cook with the correct amount of water, then rest covered for 5 minutes before fluffing.", "Steamed rice", 1m, "Side" }
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
    }
}
