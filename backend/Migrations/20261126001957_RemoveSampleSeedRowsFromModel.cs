using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <summary>
    /// The sample ingredients and recipes (ids 1 to 5 and 1 to 3, with their lines and tags) are no longer part of the
    /// model's seed data (AUDIT C4). Their rows are left alone: they are ordinary data now, which the household may use
    /// or have edited, so this migration only moves the model snapshot on. EF Core would have deleted them.
    /// </summary>
    public partial class RemoveSampleSeedRowsFromModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Deliberately empty: keep the rows.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Deliberately empty: the rows were never removed.
        }
    }
}
