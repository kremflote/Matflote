using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeRating : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Rating",
                table: "Recipes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RatingNote",
                table: "Recipes",
                type: "TEXT",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "RatingNote",
                table: "Recipes");
        }
    }
}
