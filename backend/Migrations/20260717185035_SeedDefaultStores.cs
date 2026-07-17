using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultStores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Stores",
                columns: new[] { "StoreId", "Name" },
                values: new object[,]
                {
                    { 1, "Rema 1000" },
                    { 2, "Coop Mega" },
                    { 3, "Coop Prix" },
                    { 4, "Coop Obs" },
                    { 5, "Coop Extra" },
                    { 6, "Meny" },
                    { 7, "Kiwi" },
                    { 8, "Bunnpris" },
                    { 9, "Europris" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Stores",
                keyColumn: "StoreId",
                keyValue: 9);
        }
    }
}
