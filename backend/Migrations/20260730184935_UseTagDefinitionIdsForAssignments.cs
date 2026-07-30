using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UseTagDefinitionIdsForAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IngredientTagAssignments_new (
                    IngredientId INTEGER NOT NULL,
                    IngredientTagDefinitionId INTEGER NOT NULL,
                    CONSTRAINT PK_IngredientTagAssignments PRIMARY KEY (IngredientId, IngredientTagDefinitionId),
                    CONSTRAINT FK_IngredientTagAssignments_Ingredients_IngredientId
                        FOREIGN KEY (IngredientId) REFERENCES Ingredients (IngredientId) ON DELETE CASCADE,
                    CONSTRAINT FK_IngredientTagAssignments_IngredientTagDefinitions_IngredientTagDefinitionId
                        FOREIGN KEY (IngredientTagDefinitionId) REFERENCES IngredientTagDefinitions (IngredientTagDefinitionId) ON DELETE CASCADE
                );

                INSERT OR IGNORE INTO IngredientTagAssignments_new (IngredientId, IngredientTagDefinitionId)
                SELECT DISTINCT old.IngredientId, tag.IngredientTagDefinitionId
                FROM IngredientTagAssignments old
                JOIN IngredientTagDefinitions tag
                    ON lower(tag.Name) = lower(old.Tag);

                DROP TABLE IngredientTagAssignments;
                ALTER TABLE IngredientTagAssignments_new RENAME TO IngredientTagAssignments;
                CREATE INDEX IX_IngredientTagAssignments_IngredientTagDefinitionId
                    ON IngredientTagAssignments (IngredientTagDefinitionId);
                """);

            migrationBuilder.Sql("""
                CREATE TABLE RecipeTagAssignments_new (
                    RecipeId INTEGER NOT NULL,
                    IngredientTagDefinitionId INTEGER NOT NULL,
                    CONSTRAINT PK_RecipeTagAssignments PRIMARY KEY (RecipeId, IngredientTagDefinitionId),
                    CONSTRAINT FK_RecipeTagAssignments_Recipes_RecipeId
                        FOREIGN KEY (RecipeId) REFERENCES Recipes (RecipeId) ON DELETE CASCADE,
                    CONSTRAINT FK_RecipeTagAssignments_IngredientTagDefinitions_IngredientTagDefinitionId
                        FOREIGN KEY (IngredientTagDefinitionId) REFERENCES IngredientTagDefinitions (IngredientTagDefinitionId) ON DELETE CASCADE
                );

                INSERT OR IGNORE INTO RecipeTagAssignments_new (RecipeId, IngredientTagDefinitionId)
                SELECT DISTINCT old.RecipeId, tag.IngredientTagDefinitionId
                FROM RecipeTagAssignments old
                JOIN IngredientTagDefinitions tag
                    ON lower(tag.Name) = lower(old.Tag);

                DROP TABLE RecipeTagAssignments;
                ALTER TABLE RecipeTagAssignments_new RENAME TO RecipeTagAssignments;
                CREATE INDEX IX_RecipeTagAssignments_IngredientTagDefinitionId
                    ON RecipeTagAssignments (IngredientTagDefinitionId);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TABLE IngredientTagAssignments_old (
                    IngredientId INTEGER NOT NULL,
                    Tag TEXT NOT NULL,
                    CONSTRAINT PK_IngredientTagAssignments PRIMARY KEY (IngredientId, Tag),
                    CONSTRAINT FK_IngredientTagAssignments_Ingredients_IngredientId
                        FOREIGN KEY (IngredientId) REFERENCES Ingredients (IngredientId) ON DELETE CASCADE
                );

                INSERT OR IGNORE INTO IngredientTagAssignments_old (IngredientId, Tag)
                SELECT DISTINCT assignment.IngredientId, tag.Name
                FROM IngredientTagAssignments assignment
                JOIN IngredientTagDefinitions tag
                    ON tag.IngredientTagDefinitionId = assignment.IngredientTagDefinitionId;

                DROP TABLE IngredientTagAssignments;
                ALTER TABLE IngredientTagAssignments_old RENAME TO IngredientTagAssignments;
                """);

            migrationBuilder.Sql("""
                CREATE TABLE RecipeTagAssignments_old (
                    RecipeId INTEGER NOT NULL,
                    Tag TEXT NOT NULL,
                    CONSTRAINT PK_RecipeTagAssignments PRIMARY KEY (RecipeId, Tag),
                    CONSTRAINT FK_RecipeTagAssignments_Recipes_RecipeId
                        FOREIGN KEY (RecipeId) REFERENCES Recipes (RecipeId) ON DELETE CASCADE
                );

                INSERT OR IGNORE INTO RecipeTagAssignments_old (RecipeId, Tag)
                SELECT DISTINCT assignment.RecipeId, tag.Name
                FROM RecipeTagAssignments assignment
                JOIN IngredientTagDefinitions tag
                    ON tag.IngredientTagDefinitionId = assignment.IngredientTagDefinitionId;

                DROP TABLE RecipeTagAssignments;
                ALTER TABLE RecipeTagAssignments_old RENAME TO RecipeTagAssignments;
                """);
        }
    }
}
