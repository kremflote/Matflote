using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemTagMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSystemTag",
                table: "IngredientTagDefinitions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SystemKey",
                table: "IngredientTagDefinitions",
                type: "TEXT",
                maxLength: 96,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 1,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 2,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 3,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 4,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 5,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 6,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 7,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 8,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 9,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 10,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 11,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 12,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 13,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 14,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 15,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 16,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 17,
                column: "SystemKey",
                value: null);

            migrationBuilder.UpdateData(
                table: "IngredientTagDefinitions",
                keyColumn: "IngredientTagDefinitionId",
                keyValue: 19,
                column: "SystemKey",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_IngredientTagDefinitions_SystemKey",
                table: "IngredientTagDefinitions",
                column: "SystemKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_IngredientTagDefinitions_SystemKey",
                table: "IngredientTagDefinitions");

            migrationBuilder.DropColumn(
                name: "IsSystemTag",
                table: "IngredientTagDefinitions");

            migrationBuilder.DropColumn(
                name: "SystemKey",
                table: "IngredientTagDefinitions");
        }
    }
}
