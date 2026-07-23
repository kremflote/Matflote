using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCuisine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Recipes_Cuisines_CuisineId",
                table: "Recipes");

            migrationBuilder.DropTable(
                name: "Cuisines");

            migrationBuilder.DropIndex(
                name: "IX_Recipes_CuisineId",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "CuisineId",
                table: "Recipes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CuisineId",
                table: "Recipes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Cuisines",
                columns: table => new
                {
                    CuisineId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cuisines", x => x.CuisineId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Recipes_CuisineId",
                table: "Recipes",
                column: "CuisineId");

            migrationBuilder.CreateIndex(
                name: "IX_Cuisines_Name",
                table: "Cuisines",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Recipes_Cuisines_CuisineId",
                table: "Recipes",
                column: "CuisineId",
                principalTable: "Cuisines",
                principalColumn: "CuisineId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
