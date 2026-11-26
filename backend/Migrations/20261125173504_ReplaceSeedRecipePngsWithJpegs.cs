using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <summary>
    /// The two bundled sample photos were 2.6 MB and 2.2 MB PNGs; they are now 800 px JPEGs under 200 KB.
    /// Points every recipe and ingredient that used an old file name at the new one. Rows are matched by URL,
    /// not by id, so recipes the owner gave another photo are left alone. The old PNG files stay in image
    /// storage; dropping their seed rows lets Settings → Maintenance report and remove them once unused.
    /// </summary>
    public partial class ReplaceSeedRecipePngsWithJpegs : Migration
    {
        private static readonly (string Old, string New)[] Renames =
        [
            ("/images/recipes/garlic-yogurt-sauce.png", "/images/recipes/garlic-yogurt-sauce.jpg"),
            ("/images/recipes/chicken-rice-bowl.png", "/images/recipes/chicken-rice-bowl.jpg"),
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var (oldUrl, newUrl) in Renames)
            {
                migrationBuilder.Sql($"UPDATE \"Recipes\" SET \"ImageUrl\" = '{newUrl}' WHERE \"ImageUrl\" = '{oldUrl}';");
                migrationBuilder.Sql($"UPDATE \"Ingredients\" SET \"ImageUrl\" = '{newUrl}' WHERE \"ImageUrl\" = '{oldUrl}';");
                migrationBuilder.Sql($"DELETE FROM \"UploadedImages\" WHERE \"PublicUrl\" = '{oldUrl}' AND \"Source\" = 'Seed';");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var (oldUrl, newUrl) in Renames)
            {
                migrationBuilder.Sql($"UPDATE \"Recipes\" SET \"ImageUrl\" = '{oldUrl}' WHERE \"ImageUrl\" = '{newUrl}';");
                migrationBuilder.Sql($"UPDATE \"Ingredients\" SET \"ImageUrl\" = '{oldUrl}' WHERE \"ImageUrl\" = '{newUrl}';");
            }
        }
    }
}
