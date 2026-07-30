using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTagSortOrderAndSeedCatalogTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "IngredientTagDefinitions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 1,
                column: "SortOrder",
                value: 100);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 2,
                column: "SortOrder",
                value: 200);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 3,
                column: "SortOrder",
                value: 300);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 4,
                column: "SortOrder",
                value: 400);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 5,
                column: "SortOrder",
                value: 500);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 6,
                column: "SortOrder",
                value: 600);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 7,
                column: "SortOrder",
                value: 100);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 8,
                column: "SortOrder",
                value: 200);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 9,
                column: "SortOrder",
                value: 300);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 10,
                column: "SortOrder",
                value: 400);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 11,
                column: "SortOrder",
                value: 500);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 12,
                column: "SortOrder",
                value: 600);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 13,
                column: "SortOrder",
                value: 100);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 14,
                column: "SortOrder",
                value: 200);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 15,
                column: "SortOrder",
                value: 300);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 16,
                column: "SortOrder",
                value: 400);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 17,
                column: "SortOrder",
                value: 500);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 19,
                column: "SortOrder",
                value: 600);

            migrationBuilder.Sql(
                """
                WITH ordered AS (
                    SELECT
                        tag.IngredientTagDefinitionId,
                        COALESCE((
                            SELECT MAX(existing.SortOrder)
                            FROM IngredientTagDefinitions AS existing
                            WHERE existing.IngredientTagCategoryId = tag.IngredientTagCategoryId
                              AND existing.SortOrder > 0
                        ), 0)
                        + ROW_NUMBER() OVER (
                            PARTITION BY tag.IngredientTagCategoryId
                            ORDER BY tag.Name
                        ) * 100 AS NextSortOrder
                    FROM IngredientTagDefinitions AS tag
                    WHERE tag.SortOrder = 0
                )
                UPDATE IngredientTagDefinitions
                SET SortOrder = (
                    SELECT ordered.NextSortOrder
                    FROM ordered
                    WHERE ordered.IngredientTagDefinitionId = IngredientTagDefinitions.IngredientTagDefinitionId
                )
                WHERE IngredientTagDefinitionId IN (
                    SELECT IngredientTagDefinitionId
                    FROM ordered
                );
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "IngredientTagDefinitions");
        }
    }
}
