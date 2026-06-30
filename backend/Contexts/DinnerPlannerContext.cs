using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Contexts;

public class DinnerPlannerContext(DbContextOptions<DinnerPlannerContext> options) : DbContext(options)
{
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<DishTypeAssignment> DishTypeAssignments => Set<DishTypeAssignment>();
    public DbSet<Dish> Dishes => Set<Dish>();
    public DbSet<Dessert> Desserts => Set<Dessert>();
    public DbSet<Sauce> Sauces => Set<Sauce>();
    public DbSet<Dip> Dips => Set<Dip>();
    public DbSet<Side> Sides => Set<Side>();
    public DbSet<SpiceMix> SpiceMixes => Set<SpiceMix>();
    public DbSet<MealPlanEntry> MealPlanEntries => Set<MealPlanEntry>();
    public DbSet<MealPlanRecipe> MealPlanRecipes => Set<MealPlanRecipe>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.Property(ingredient => ingredient.IngredientName).HasMaxLength(160);
            entity.Property(ingredient => ingredient.Price).HasPrecision(10, 2);
            entity.Property(ingredient => ingredient.Amount).HasPrecision(10, 2);
            entity.Property(ingredient => ingredient.Unit).HasConversion<string>().HasMaxLength(40);
            entity.Property(ingredient => ingredient.Category).HasConversion<string>().HasMaxLength(64);
            entity.OwnsOne(ingredient => ingredient.NutritionPer100, nutrition =>
            {
                nutrition.Property(value => value.DietaryFiberGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.Vitamins).HasMaxLength(300);
            });
        });

        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.Property(recipe => recipe.Name).HasMaxLength(160);
            entity.Property(recipe => recipe.Description).HasMaxLength(600);

            entity.HasDiscriminator<string>("RecipeType")
                .HasValue<Dish>("Dish")
                .HasValue<Dessert>("Dessert")
                .HasValue<Sauce>("Sauce")
                .HasValue<Dip>("Dip")
                .HasValue<Side>("Side")
                .HasValue<SpiceMix>("SpiceMix");

            entity.HasMany(recipe => recipe.Ingredients)
                .WithMany()
                .UsingEntity<Dictionary<string, object>>(
                    "RecipeIngredients",
                    right => right
                        .HasOne<Ingredient>()
                        .WithMany()
                        .HasForeignKey("IngredientId")
                        .OnDelete(DeleteBehavior.Restrict),
                    left => left
                        .HasOne<Recipe>()
                        .WithMany()
                        .HasForeignKey("RecipeId")
                        .OnDelete(DeleteBehavior.Cascade),
                    join =>
                    {
                        join.HasKey("RecipeId", "IngredientId");
                        join.ToTable("RecipeIngredients");
                        join.HasData(
                            new { RecipeId = 1, IngredientId = 3 },
                            new { RecipeId = 1, IngredientId = 2 },
                            new { RecipeId = 1, IngredientId = 5 },
                            new { RecipeId = 2, IngredientId = 1 },
                            new { RecipeId = 2, IngredientId = 4 }
                        );
                    });
        });

        modelBuilder.Entity<DishTypeAssignment>(entity =>
        {
            entity.HasKey(dishType => new
            {
                dishType.DishId,
                dishType.Type
            });

            entity.Property(dishType => dishType.Type).HasConversion<string>().HasMaxLength(64);
            entity.HasOne(dishType => dishType.Dish)
                .WithMany(dish => dish.Types)
                .HasForeignKey(dishType => dishType.DishId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Dish>(entity =>
        {
            entity.Property(dish => dish.Name).HasMaxLength(160);
            entity.Property(dish => dish.Cuisine).HasConversion<string>().HasMaxLength(64);
        });

        modelBuilder.Entity<Dessert>(entity =>
        {
            entity.Property(dessert => dessert.Name).HasMaxLength(160);
            entity.Property(dessert => dessert.Type).HasConversion<string>().HasMaxLength(64);
        });

        modelBuilder.Entity<MealPlanEntry>(entity =>
        {
            entity.Property(entry => entry.Slot).HasConversion<string>().HasMaxLength(40);
            entity.Property(entry => entry.Notes).HasMaxLength(500);
            entity.HasIndex(entry => new
            {
                entry.Date,
                entry.Slot
            }).IsUnique();
        });

        modelBuilder.Entity<MealPlanRecipe>(entity =>
        {
            entity.Property(planRecipe => planRecipe.Role).HasConversion<string>().HasMaxLength(40);

            entity.HasOne(planRecipe => planRecipe.MealPlanEntry)
                .WithMany(entry => entry.Recipes)
                .HasForeignKey(planRecipe => planRecipe.MealPlanEntryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(planRecipe => planRecipe.Recipe)
                .WithMany()
                .HasForeignKey(planRecipe => planRecipe.RecipeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(planRecipe => new
            {
                planRecipe.MealPlanEntryId,
                planRecipe.SortOrder
            });
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ingredient>().HasData(
            new
            {
                IngredientId = 1,
                IngredientName = "Chicken breast",
                Brand = (string?)null,
                Price = (decimal?)89.90m,
                Amount = (decimal?)1m,
                Unit = MeasurementUnit.Kilogram,
                Category = IngredientCategory.Chicken,
                Color = "#f6d4b8"
            },
            new
            {
                IngredientId = 2,
                IngredientName = "Garlic",
                Brand = (string?)null,
                Price = (decimal?)14.90m,
                Amount = (decimal?)1m,
                Unit = MeasurementUnit.Piece,
                Category = IngredientCategory.Vegetable,
                Color = "#f4ead2"
            },
            new
            {
                IngredientId = 3,
                IngredientName = "Greek yogurt",
                Brand = (string?)null,
                Price = (decimal?)34.90m,
                Amount = (decimal?)500m,
                Unit = MeasurementUnit.Gram,
                Category = IngredientCategory.Dairy,
                Color = "#fff7ef"
            },
            new
            {
                IngredientId = 4,
                IngredientName = "Rice",
                Brand = (string?)null,
                Price = (decimal?)39.90m,
                Amount = (decimal?)1m,
                Unit = MeasurementUnit.Kilogram,
                Category = IngredientCategory.Grain,
                Color = "#f6f0df"
            },
            new
            {
                IngredientId = 5,
                IngredientName = "Lemon",
                Brand = (string?)null,
                Price = (decimal?)8.90m,
                Amount = (decimal?)1m,
                Unit = MeasurementUnit.Piece,
                Category = IngredientCategory.Fruit,
                Color = "#f9dc5c"
            }
        );

        modelBuilder.Entity<Sauce>().HasData(new
        {
            RecipeId = 1,
            Name = "Garlic yogurt sauce",
            ImageUrl = (string?)null,
            Description = "Fresh yogurt sauce with garlic and lemon.",
            Instructions = "Grate the garlic, stir it into yogurt with lemon, and season to taste."
        });

        modelBuilder.Entity<Dish>().HasData(new
        {
            RecipeId = 2,
            Name = "Chicken rice bowl",
            ImageUrl = (string?)null,
            Description = "Simple chicken bowl with rice and sauce.",
            Instructions = "Cook rice. Fry chicken until done. Serve with garlic yogurt sauce.",
            Cuisine = Cuisine.Asian
        });

        modelBuilder.Entity<DishTypeAssignment>().HasData(new
        {
            DishId = 2,
            Type = DishType.Bowl
        });

        modelBuilder.Entity<Side>().HasData(new
        {
            RecipeId = 3,
            Name = "Steamed rice",
            ImageUrl = (string?)null,
            Description = "",
            Instructions = "Rinse rice and steam until tender."
        });
    }
}
