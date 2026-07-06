using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class TagLeafyGreenIngredients : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT OR IGNORE INTO "IngredientTagAssignments" ("IngredientId", "Tag")
                SELECT "IngredientId", 'LeafyGreen'
                FROM "Ingredients"
                WHERE lower("IngredientName") IN (
                    'arugula',
                    'baby spinach',
                    'bok choy',
                    'cabbage',
                    'chard',
                    'collard greens',
                    'kale',
                    'lettuce',
                    'pak choi',
                    'rocket',
                    'romaine',
                    'romaine lettuce',
                    'spinach',
                    'spring greens'
                )
                OR lower("IngredientName") LIKE '%lettuce%'
                OR lower("IngredientName") LIKE '%spinach%'
                OR lower("IngredientName") LIKE '%kale%'
                OR lower("IngredientName") LIKE '%arugula%'
                OR lower("IngredientName") LIKE '%rocket%'
                OR lower("IngredientName") LIKE '%cabbage%'
                OR lower("IngredientName") LIKE '%chard%';
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM "IngredientTagAssignments"
                WHERE "Tag" = 'LeafyGreen'
                AND "IngredientId" IN (
                    SELECT "IngredientId"
                    FROM "Ingredients"
                    WHERE lower("IngredientName") IN (
                        'arugula',
                        'baby spinach',
                        'bok choy',
                        'cabbage',
                        'chard',
                        'collard greens',
                        'kale',
                        'lettuce',
                        'pak choi',
                        'rocket',
                        'romaine',
                        'romaine lettuce',
                        'spinach',
                        'spring greens'
                    )
                    OR lower("IngredientName") LIKE '%lettuce%'
                    OR lower("IngredientName") LIKE '%spinach%'
                    OR lower("IngredientName") LIKE '%kale%'
                    OR lower("IngredientName") LIKE '%arugula%'
                    OR lower("IngredientName") LIKE '%rocket%'
                    OR lower("IngredientName") LIKE '%cabbage%'
                    OR lower("IngredientName") LIKE '%chard%'
                );
                """
            );
        }
    }
}
