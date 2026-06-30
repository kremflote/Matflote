using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class MultiDishTypesAndDessertType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Dessert_Type",
                table: "KitchenItems");

            migrationBuilder.CreateTable(
                name: "DishTypeAssignments",
                columns: table => new
                {
                    DishId = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DishTypeAssignments", x => new { x.DishId, x.Type });
                    table.ForeignKey(
                        name: "FK_DishTypeAssignments_KitchenItems_DishId",
                        column: x => x.DishId,
                        principalTable: "KitchenItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "DishTypeAssignments",
                columns: new[] { "DishId", "Type" },
                values: new object[] { 2, "Bowl" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DishTypeAssignments");

            migrationBuilder.AddColumn<string>(
                name: "Dessert_Type",
                table: "KitchenItems",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "KitchenItems",
                keyColumn: "Id",
                keyValue: 2,
                column: "Type",
                value: "Bowl");
        }
    }
}
