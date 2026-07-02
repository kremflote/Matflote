using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace DinnerPlanner.Api.Contexts;

public class DinnerPlannerContext(DbContextOptions<DinnerPlannerContext> options) : DbContext(options)
{
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Cuisine> Cuisines => Set<Cuisine>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<IngredientTagAssignment> IngredientTagAssignments => Set<IngredientTagAssignment>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<RecipeTagAssignment> RecipeTagAssignments => Set<RecipeTagAssignment>();
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

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.Property(brand => brand.Name).HasMaxLength(120);
            entity.HasIndex(brand => brand.Name).IsUnique();
        });

        modelBuilder.Entity<Cuisine>(entity =>
        {
            entity.Property(cuisine => cuisine.Name).HasMaxLength(120);
            entity.HasIndex(cuisine => cuisine.Name).IsUnique();
        });

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.Property(ingredient => ingredient.IngredientName).HasMaxLength(160);
            entity.Property(ingredient => ingredient.Description).HasMaxLength(600);
            entity.Property(ingredient => ingredient.Price).HasPrecision(10, 2);
            entity.HasOne(ingredient => ingredient.Brand)
                .WithMany()
                .HasForeignKey(ingredient => ingredient.BrandId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.OwnsOne(ingredient => ingredient.NutritionPer100, nutrition =>
            {
                nutrition.Property(value => value.CarbohydrateGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.ProteinGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.SaltGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.DietaryFiberGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.SaturatedFatGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.UnsaturatedFatGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.MonounsaturatedFatGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.PolyunsaturatedFatGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.Vitamins)
                    .HasConversion(
                        vitamins => string.Join(",", vitamins.Select(vitamin => vitamin.ToString())),
                        value => ParseVitamins(value)
                    )
                    .Metadata.SetValueComparer(new ValueComparer<List<Vitamin>>(
                        (first, second) => first != null && second != null && first.SequenceEqual(second),
                        vitamins => vitamins.Aggregate(0, (hash, vitamin) => HashCode.Combine(hash, vitamin.GetHashCode())),
                        vitamins => vitamins.ToList()
                    ));
            });
        });

        modelBuilder.Entity<IngredientTagAssignment>(entity =>
        {
            entity.HasKey(ingredientTag => new
            {
                ingredientTag.IngredientId,
                ingredientTag.Tag
            });

            entity.Property(ingredientTag => ingredientTag.Tag).HasConversion<string>().HasMaxLength(64);
            entity.HasOne(ingredientTag => ingredientTag.Ingredient)
                .WithMany(ingredient => ingredient.Tags)
                .HasForeignKey(ingredientTag => ingredientTag.IngredientId)
                .OnDelete(DeleteBehavior.Cascade);
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
                .WithOne(recipeIngredient => recipeIngredient.Recipe)
                .HasForeignKey(recipeIngredient => recipeIngredient.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RecipeIngredient>(entity =>
        {
            entity.Property(recipeIngredient => recipeIngredient.Amount).HasPrecision(10, 2);
            entity.Property(recipeIngredient => recipeIngredient.Unit).HasConversion<string>().HasMaxLength(40);

            entity.HasOne(recipeIngredient => recipeIngredient.Ingredient)
                .WithMany()
                .HasForeignKey(recipeIngredient => recipeIngredient.IngredientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(recipeIngredient => new
            {
                recipeIngredient.RecipeId,
                recipeIngredient.IngredientId
            }).IsUnique();
        });

        modelBuilder.Entity<RecipeTagAssignment>(entity =>
        {
            entity.HasKey(recipeTag => new
            {
                recipeTag.RecipeId,
                recipeTag.Tag
            });

            entity.Property(recipeTag => recipeTag.Tag).HasConversion<string>().HasMaxLength(64);
            entity.HasOne(recipeTag => recipeTag.Recipe)
                .WithMany(recipe => recipe.Tags)
                .HasForeignKey(recipeTag => recipeTag.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Dish>(entity =>
        {
            entity.Property(dish => dish.Name).HasMaxLength(160);
            entity.HasOne(dish => dish.Cuisine)
                .WithMany()
                .HasForeignKey(dish => dish.CuisineId)
                .OnDelete(DeleteBehavior.SetNull);
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
        modelBuilder.Entity<Cuisine>().HasData(
            new { CuisineId = 1, Name = "Korean" },
            new { CuisineId = 2, Name = "Indian" },
            new { CuisineId = 3, Name = "Mediterranean" },
            new { CuisineId = 4, Name = "French" },
            new { CuisineId = 5, Name = "Norwegian" },
            new { CuisineId = 6, Name = "Mexican" },
            new { CuisineId = 7, Name = "Italian" },
            new { CuisineId = 8, Name = "Japanese" },
            new { CuisineId = 9, Name = "Vietnamese" },
            new { CuisineId = 10, Name = "Other" }
        );

        modelBuilder.Entity<Ingredient>().HasData(
            new
            {
                IngredientId = 1,
                IngredientName = "Chicken breast",
                Description = "Lean poultry cut with mild flavor. Useful as the main protein in bowls, salads, soups, and quick pan-fried dinners.",
                BrandId = (int?)null,
                Price = (decimal?)89.90m,
                NutritionPer100_Calories = (int?)165,
                NutritionPer100_CarbohydrateGrams = (decimal?)0m,
                NutritionPer100_ProteinGrams = (decimal?)31m,
                NutritionPer100_SaltGrams = (decimal?)0.18m,
                NutritionPer100_DietaryFiberGrams = (decimal?)0m,
                NutritionPer100_SaturatedFatGrams = (decimal?)1m,
                NutritionPer100_UnsaturatedFatGrams = (decimal?)2.6m,
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)1.2m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.8m,
                NutritionPer100_Vitamins = "VitaminB,VitaminB12",
                Color = "#f6d4b8"
            },
            new
            {
                IngredientId = 2,
                IngredientName = "Garlic",
                Description = "Aromatic vegetable used to build flavor in sauces, marinades, soups, stir fries, and roasted dishes.",
                BrandId = (int?)null,
                Price = (decimal?)14.90m,
                NutritionPer100_Calories = (int?)149,
                NutritionPer100_CarbohydrateGrams = (decimal?)33.1m,
                NutritionPer100_ProteinGrams = (decimal?)6.4m,
                NutritionPer100_SaltGrams = (decimal?)0.04m,
                NutritionPer100_DietaryFiberGrams = (decimal?)2.1m,
                NutritionPer100_SaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_UnsaturatedFatGrams = (decimal?)0.4m,
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.2m,
                NutritionPer100_Vitamins = "VitaminB,VitaminC",
                Color = "#f4ead2"
            },
            new
            {
                IngredientId = 3,
                IngredientName = "Greek yogurt",
                Description = "Thick cultured dairy product. Works as a base for cold sauces, dressings, marinades, and high-protein breakfasts.",
                BrandId = (int?)null,
                Price = (decimal?)34.90m,
                NutritionPer100_Calories = (int?)97,
                NutritionPer100_CarbohydrateGrams = (decimal?)3.6m,
                NutritionPer100_ProteinGrams = (decimal?)9m,
                NutritionPer100_SaltGrams = (decimal?)0.1m,
                NutritionPer100_DietaryFiberGrams = (decimal?)0m,
                NutritionPer100_SaturatedFatGrams = (decimal?)1.6m,
                NutritionPer100_UnsaturatedFatGrams = (decimal?)0.8m,
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0.7m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_Vitamins = "VitaminB,VitaminB12",
                Color = "#fff7ef"
            },
            new
            {
                IngredientId = 4,
                IngredientName = "Rice",
                Description = "Neutral grain that works as a side or base for bowls, curries, stir fries, and meal prep portions.",
                BrandId = (int?)null,
                Price = (decimal?)39.90m,
                NutritionPer100_Calories = (int?)130,
                NutritionPer100_CarbohydrateGrams = (decimal?)28.2m,
                NutritionPer100_ProteinGrams = (decimal?)2.7m,
                NutritionPer100_SaltGrams = (decimal?)0.01m,
                NutritionPer100_DietaryFiberGrams = (decimal?)0.4m,
                NutritionPer100_SaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_UnsaturatedFatGrams = (decimal?)0.2m,
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_Vitamins = "VitaminB",
                Color = "#f6f0df"
            },
            new
            {
                IngredientId = 5,
                IngredientName = "Lemon",
                Description = "Bright acidic fruit used for sauces, dressings, marinades, desserts, and finishing cooked dishes.",
                BrandId = (int?)null,
                Price = (decimal?)8.90m,
                NutritionPer100_Calories = (int?)29,
                NutritionPer100_CarbohydrateGrams = (decimal?)9.3m,
                NutritionPer100_ProteinGrams = (decimal?)1.1m,
                NutritionPer100_SaltGrams = (decimal?)0m,
                NutritionPer100_DietaryFiberGrams = (decimal?)2.8m,
                NutritionPer100_SaturatedFatGrams = (decimal?)0m,
                NutritionPer100_UnsaturatedFatGrams = (decimal?)0.2m,
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_Vitamins = "VitaminC",
                Color = "#f9dc5c"
            }
        );

        modelBuilder.Entity<IngredientTagAssignment>().HasData(
            new
            {
                IngredientId = 1,
                Tag = IngredientTag.Chicken
            },
            new
            {
                IngredientId = 2,
                Tag = IngredientTag.Vegetable
            },
            new
            {
                IngredientId = 3,
                Tag = IngredientTag.Dairy
            },
            new
            {
                IngredientId = 4,
                Tag = IngredientTag.Grain
            },
            new
            {
                IngredientId = 5,
                Tag = IngredientTag.Fruit
            }
        );

        modelBuilder.Entity<Sauce>().HasData(new
        {
            RecipeId = 1,
            Name = "Garlic yogurt sauce",
            ImageUrl = "/images/recipes/garlic-yogurt-sauce.png",
            Description = "Cold yogurt sauce with grated garlic and lemon. Best with chicken bowls, grilled meat, roasted vegetables, and rice.",
            Instructions = "Grate the garlic finely. Stir garlic, lemon juice, and a little lemon zest into the yogurt. Season with salt and let it rest for at least 10 minutes before serving."
        });

        modelBuilder.Entity<Dish>().HasData(new
        {
            RecipeId = 2,
            Name = "Chicken rice bowl",
            ImageUrl = "/images/recipes/chicken-rice-bowl.png",
            Description = "Weeknight bowl with pan-fried chicken, steamed rice, and fresh garlic yogurt sauce. Good as dinner and easy to scale for meal prep.",
            Instructions = "Rinse the rice and cook until tender. Slice the chicken breast, season lightly, and fry in a hot pan until cooked through. Spoon rice into bowls, add chicken, and finish with garlic yogurt sauce.",
            CuisineId = (int?)1
        });

        modelBuilder.Entity<RecipeTagAssignment>().HasData(new
        {
            RecipeId = 2,
            Tag = RecipeTag.Bowl
        });

        modelBuilder.Entity<RecipeIngredient>().HasData(
            new
            {
                RecipeIngredientId = 1,
                RecipeId = 1,
                IngredientId = 3,
                Amount = (decimal?)200m,
                Unit = MeasurementUnit.Gram
            },
            new
            {
                RecipeIngredientId = 2,
                RecipeId = 1,
                IngredientId = 2,
                Amount = (decimal?)1m,
                Unit = MeasurementUnit.Clove
            },
            new
            {
                RecipeIngredientId = 3,
                RecipeId = 1,
                IngredientId = 5,
                Amount = (decimal?)0.5m,
                Unit = MeasurementUnit.Piece
            },
            new
            {
                RecipeIngredientId = 4,
                RecipeId = 2,
                IngredientId = 1,
                Amount = (decimal?)400m,
                Unit = MeasurementUnit.Gram
            },
            new
            {
                RecipeIngredientId = 5,
                RecipeId = 2,
                IngredientId = 4,
                Amount = (decimal?)250m,
                Unit = MeasurementUnit.Gram
            },
            new
            {
                RecipeIngredientId = 6,
                RecipeId = 3,
                IngredientId = 4,
                Amount = (decimal?)250m,
                Unit = MeasurementUnit.Gram
            }
        );

        modelBuilder.Entity<Side>().HasData(new
        {
            RecipeId = 3,
            Name = "Steamed rice",
            ImageUrl = (string?)null,
            Description = "Plain steamed rice for bowls, curries, stir fries, and saucy dishes.",
            Instructions = "Rinse the rice until the water runs mostly clear. Cook with the correct amount of water, then rest covered for 5 minutes before fluffing."
        });
    }

    private static List<Vitamin> ParseVitamins(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value
                .Split(",", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(vitaminName =>
                    Enum.TryParse(vitaminName, out Vitamin vitamin)
                        ? (Vitamin?)vitamin
                        : null
                )
                .Where(vitamin => vitamin.HasValue)
                .Select(vitamin => vitamin!.Value)
                .Distinct()
                .ToList();
}
