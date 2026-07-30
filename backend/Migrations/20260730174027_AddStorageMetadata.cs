using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStorageMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM IngredientTagAssignments
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM IngredientTagDefinitions
                    WHERE lower(IngredientTagDefinitions.Name) = lower(IngredientTagAssignments.Tag)
                );
                """);

            migrationBuilder.Sql("""
                DELETE FROM RecipeTagAssignments
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM IngredientTagDefinitions
                    WHERE lower(IngredientTagDefinitions.Name) = lower(RecipeTagAssignments.Tag)
                );
                """);

            migrationBuilder.CreateTable(
                name: "DataImportRuns",
                columns: table => new
                {
                    DataImportRunId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Source = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    IngredientCount = table.Column<int>(type: "INTEGER", nullable: false),
                    RecipeCount = table.Column<int>(type: "INTEGER", nullable: false),
                    BrandCount = table.Column<int>(type: "INTEGER", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataImportRuns", x => x.DataImportRunId);
                });

            migrationBuilder.CreateTable(
                name: "UploadedImages",
                columns: table => new
                {
                    UploadedImageId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 260, nullable: false),
                    PublicUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    RelativePath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Folder = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Source = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    OriginalFileName = table.Column<string>(type: "TEXT", maxLength: 260, nullable: true),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    SizeBytes = table.Column<long>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UploadedImages", x => x.UploadedImageId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataImportRuns_StartedAt",
                table: "DataImportRuns",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UploadedImages_CreatedAt",
                table: "UploadedImages",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UploadedImages_PublicUrl",
                table: "UploadedImages",
                column: "PublicUrl",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataImportRuns");

            migrationBuilder.DropTable(
                name: "UploadedImages");
        }
    }
}
