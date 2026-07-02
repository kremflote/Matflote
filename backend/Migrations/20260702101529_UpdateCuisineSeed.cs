using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCuisineSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Cuisines",
                keyColumn: "CuisineId",
                keyValue: 1,
                column: "Name",
                value: "Korean");

            migrationBuilder.UpdateData(
                table: "Cuisines",
                keyColumn: "CuisineId",
                keyValue: 8,
                column: "Name",
                value: "Japanese");

            migrationBuilder.UpdateData(
                table: "Cuisines",
                keyColumn: "CuisineId",
                keyValue: 9,
                column: "Name",
                value: "Vietnamese");

            migrationBuilder.InsertData(
                table: "Cuisines",
                columns: new[] { "CuisineId", "Name" },
                values: new object[] { 10, "Other" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Cuisines",
                keyColumn: "CuisineId",
                keyValue: 10);

            migrationBuilder.UpdateData(
                table: "Cuisines",
                keyColumn: "CuisineId",
                keyValue: 1,
                column: "Name",
                value: "Asian");

            migrationBuilder.UpdateData(
                table: "Cuisines",
                keyColumn: "CuisineId",
                keyValue: 8,
                column: "Name",
                value: "Grill");

            migrationBuilder.UpdateData(
                table: "Cuisines",
                keyColumn: "CuisineId",
                keyValue: 9,
                column: "Name",
                value: "Other");

        }
    }
}
