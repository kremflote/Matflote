using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace DinnerPlanner.Api.Contexts;

public class DinnerPlannerContext(DbContextOptions<DinnerPlannerContext> options) : DbContext(options)
{
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Cuisine> Cuisines => Set<Cuisine>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<IngredientPricePoint> IngredientPricePoints => Set<IngredientPricePoint>();
    public DbSet<IngredientTagCategory> IngredientTagCategories => Set<IngredientTagCategory>();
    public DbSet<IngredientTagDefinition> IngredientTagDefinitions => Set<IngredientTagDefinition>();
    public DbSet<IngredientTagAssignment> IngredientTagAssignments => Set<IngredientTagAssignment>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeComponent> RecipeComponents => Set<RecipeComponent>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<RecipeTagAssignment> RecipeTagAssignments => Set<RecipeTagAssignment>();
    public DbSet<Dish> Dishes => Set<Dish>();
    public DbSet<Dessert> Desserts => Set<Dessert>();
    public DbSet<Sauce> Sauces => Set<Sauce>();
    public DbSet<Dip> Dips => Set<Dip>();
    public DbSet<Side> Sides => Set<Side>();
    public DbSet<SpiceMix> SpiceMixes => Set<SpiceMix>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<MealPlanEntry> MealPlanEntries => Set<MealPlanEntry>();
    public DbSet<MealPlanRecipe> MealPlanRecipes => Set<MealPlanRecipe>();
    public DbSet<NutritionReferenceImportRun> NutritionReferenceImportRuns => Set<NutritionReferenceImportRun>();
    public DbSet<NutritionReferenceProfile> NutritionReferenceProfiles => Set<NutritionReferenceProfile>();
    public DbSet<NutritionReferenceValue> NutritionReferenceValues => Set<NutritionReferenceValue>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppSetting>(entity =>
        {
            entity.HasKey(setting => setting.Key);
            entity.Property(setting => setting.Key).HasMaxLength(160);
            entity.Property(setting => setting.Value).HasMaxLength(2000);
        });

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
            entity.Property(ingredient => ingredient.IngredientName).HasMaxLength(ValidationLimits.IngredientNameMaxLength);
            entity.Property(ingredient => ingredient.Description).HasMaxLength(600);
            entity.Property(ingredient => ingredient.ImageUrl).HasMaxLength(500);
            entity.Property(ingredient => ingredient.Price).HasPrecision(10, 2);
            entity.Property(ingredient => ingredient.NutritionSource).HasConversion<string>().HasMaxLength(40);
            entity.Property(ingredient => ingredient.NutritionSourceLabel).HasMaxLength(160);
            entity.Property(ingredient => ingredient.MatvaretabellenFoodId).HasMaxLength(80);
            entity.Property(ingredient => ingredient.NutritionMatchedName).HasMaxLength(160);
            entity.Property(ingredient => ingredient.NutritionMatchConfidence).HasPrecision(4, 3);
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
                nutrition.Property(value => value.TransFatGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.MonounsaturatedFatGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.PolyunsaturatedFatGrams).HasPrecision(8, 2);
                nutrition.Property(value => value.Omega3Grams).HasPrecision(8, 2);
                nutrition.Property(value => value.Omega6Grams).HasPrecision(8, 2);
                nutrition.Property(value => value.CholesterolMilligrams).HasPrecision(8, 2);
                nutrition.Property(value => value.VitaminAMicrograms).HasPrecision(8, 2);
                nutrition.Property(value => value.VitaminB9Micrograms).HasPrecision(8, 2);
                nutrition.Property(value => value.VitaminB12Micrograms).HasPrecision(8, 2);
                nutrition.Property(value => value.VitaminCMilligrams).HasPrecision(8, 2);
                nutrition.Property(value => value.VitaminDMicrograms).HasPrecision(8, 2);
                nutrition.Property(value => value.VitaminEMilligrams).HasPrecision(8, 2);
                nutrition.Property(value => value.VitaminKMicrograms).HasPrecision(8, 2);
                nutrition.Property(value => value.CholineMilligrams).HasPrecision(8, 2);
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

            entity.Property(ingredientTag => ingredientTag.Tag).HasMaxLength(64);
            entity.HasOne(ingredientTag => ingredientTag.Ingredient)
                .WithMany(ingredient => ingredient.Tags)
                .HasForeignKey(ingredientTag => ingredientTag.IngredientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IngredientTagCategory>(entity =>
        {
            entity.Property(category => category.Name).HasMaxLength(120);
            entity.HasIndex(category => category.Name).IsUnique();
            entity.HasMany(category => category.Tags)
                .WithOne(tag => tag.Category)
                .HasForeignKey(tag => tag.IngredientTagCategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IngredientTagDefinition>(entity =>
        {
            entity.Property(tag => tag.Name).HasMaxLength(64);
            entity.HasIndex(tag => tag.Name).IsUnique();
        });

        modelBuilder.Entity<Store>(entity =>
        {
            entity.Property(store => store.Name).HasMaxLength(120);
            entity.HasIndex(store => store.Name).IsUnique();
        });

        modelBuilder.Entity<IngredientPricePoint>(entity =>
        {
            entity.Property(pricePoint => pricePoint.Price).HasPrecision(10, 2);
            entity.Property(pricePoint => pricePoint.Note).HasMaxLength(500);

            entity.HasOne(pricePoint => pricePoint.Ingredient)
                .WithMany()
                .HasForeignKey(pricePoint => pricePoint.IngredientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pricePoint => pricePoint.Store)
                .WithMany(store => store.PricePoints)
                .HasForeignKey(pricePoint => pricePoint.StoreId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(pricePoint => new
            {
                pricePoint.IngredientId,
                pricePoint.Date
            });
        });

        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.Property(recipe => recipe.Name).HasMaxLength(30);
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

            entity.HasMany(recipe => recipe.Components)
                .WithOne(component => component.ParentRecipe)
                .HasForeignKey(component => component.ParentRecipeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(recipe => recipe.UsedInRecipes)
                .WithOne(component => component.ChildRecipe)
                .HasForeignKey(component => component.ChildRecipeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RecipeComponent>(entity =>
        {
            entity.HasKey(component => new
            {
                component.ParentRecipeId,
                component.ChildRecipeId
            });

            entity.HasIndex(component => new
            {
                component.ParentRecipeId,
                component.SortOrder
            });
        });

        modelBuilder.Entity<RecipeIngredient>(entity =>
        {
            entity.Property(recipeIngredient => recipeIngredient.Amount).HasPrecision(10, 2);
            entity.Property(recipeIngredient => recipeIngredient.Unit).HasConversion<string>().HasMaxLength(40);
            entity.Property(recipeIngredient => recipeIngredient.Preparation)
                .HasConversion<string>()
                .HasMaxLength(40)
                .HasDefaultValue(IngredientPreparation.None);

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
            entity.Property(dish => dish.Name).HasMaxLength(30);
            entity.HasOne(dish => dish.Cuisine)
                .WithMany()
                .HasForeignKey(dish => dish.CuisineId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Dessert>(entity =>
        {
            entity.Property(dessert => dessert.Name).HasMaxLength(30);
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

        modelBuilder.Entity<NutritionReferenceImportRun>(entity =>
        {
            entity.Property(importRun => importRun.Provider).HasMaxLength(120);
            entity.Property(importRun => importRun.Status).HasMaxLength(80);
            entity.Property(importRun => importRun.Message).HasMaxLength(1000);
            entity.Property(importRun => importRun.SourceUrl).HasMaxLength(500);
        });

        modelBuilder.Entity<NutritionReferenceProfile>(entity =>
        {
            entity.Property(profile => profile.ProfileId).HasMaxLength(80);
            entity.Property(profile => profile.Label).HasMaxLength(120);
            entity.Property(profile => profile.Gender).HasMaxLength(40);
            entity.Property(profile => profile.SourceUrl).HasMaxLength(500);
            entity.HasIndex(profile => profile.ProfileId).IsUnique();

            entity.HasMany(profile => profile.ReferenceValues)
                .WithOne(value => value.Profile)
                .HasForeignKey(value => value.NutritionReferenceProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NutritionReferenceValue>(entity =>
        {
            entity.Property(value => value.NutrientKey).HasMaxLength(80);
            entity.Property(value => value.Label).HasMaxLength(120);
            entity.Property(value => value.DailyAmount).HasPrecision(10, 2);
            entity.Property(value => value.Unit).HasMaxLength(20);
            entity.Property(value => value.ValueType).HasConversion<string>().HasMaxLength(40);
            entity.HasIndex(value => new
            {
                value.NutritionReferenceProfileId,
                value.NutrientKey
            }).IsUnique();
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

        modelBuilder.Entity<Store>().HasData(
            new { StoreId = 1, Name = "Rema 1000" },
            new { StoreId = 2, Name = "Coop Mega" },
            new { StoreId = 3, Name = "Coop Prix" },
            new { StoreId = 4, Name = "Coop Obs" },
            new { StoreId = 5, Name = "Coop Extra" },
            new { StoreId = 6, Name = "Meny" },
            new { StoreId = 7, Name = "Kiwi" },
            new { StoreId = 8, Name = "Bunnpris" },
            new { StoreId = 9, Name = "Europris" }
        );

        modelBuilder.Entity<NutritionReferenceProfile>().HasData(CreateNutritionReferenceProfiles());
        modelBuilder.Entity<NutritionReferenceValue>().HasData(CreateNutritionReferenceValues());

        modelBuilder.Entity<IngredientTagCategory>().HasData(
            new { IngredientTagCategoryId = 1, Name = "Produce", SortOrder = 100 },
            new { IngredientTagCategoryId = 2, Name = "Protein", SortOrder = 200 },
            new { IngredientTagCategoryId = 3, Name = "Pantry", SortOrder = 300 }
        );

        modelBuilder.Entity<IngredientTagDefinition>().HasData(
            new { IngredientTagDefinitionId = 1, Name = "Vegetable", IngredientTagCategoryId = 1 },
            new { IngredientTagDefinitionId = 2, Name = "Fruit", IngredientTagCategoryId = 1 },
            new { IngredientTagDefinitionId = 3, Name = "Berry", IngredientTagCategoryId = 1 },
            new { IngredientTagDefinitionId = 4, Name = "RootVegetable", IngredientTagCategoryId = 1 },
            new { IngredientTagDefinitionId = 5, Name = "LeafyGreen", IngredientTagCategoryId = 1 },
            new { IngredientTagDefinitionId = 6, Name = "Herb", IngredientTagCategoryId = 1 },
            new { IngredientTagDefinitionId = 7, Name = "Chicken", IngredientTagCategoryId = 2 },
            new { IngredientTagDefinitionId = 8, Name = "Fish", IngredientTagCategoryId = 2 },
            new { IngredientTagDefinitionId = 9, Name = "Beef", IngredientTagCategoryId = 2 },
            new { IngredientTagDefinitionId = 10, Name = "Lamb", IngredientTagCategoryId = 2 },
            new { IngredientTagDefinitionId = 11, Name = "Mince", IngredientTagCategoryId = 2 },
            new { IngredientTagDefinitionId = 12, Name = "Dairy", IngredientTagCategoryId = 2 },
            new { IngredientTagDefinitionId = 13, Name = "Grain", IngredientTagCategoryId = 3 },
            new { IngredientTagDefinitionId = 14, Name = "Bread", IngredientTagCategoryId = 3 },
            new { IngredientTagDefinitionId = 15, Name = "Spice", IngredientTagCategoryId = 3 },
            new { IngredientTagDefinitionId = 16, Name = "Sauce", IngredientTagCategoryId = 3 },
            new { IngredientTagDefinitionId = 17, Name = "Dip", IngredientTagCategoryId = 3 },
            new { IngredientTagDefinitionId = 18, Name = "Pantry", IngredientTagCategoryId = 3 },
            new { IngredientTagDefinitionId = 19, Name = "Frozen", IngredientTagCategoryId = 3 }
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
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)1.2m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.8m,
                NutritionPer100_Vitamins = "VitaminB12",
                NutritionSource = NutritionDataSource.Manual,
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
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.2m,
                NutritionPer100_Vitamins = "VitaminC",
                NutritionSource = NutritionDataSource.Manual,
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
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0.7m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_Vitamins = "VitaminB12",
                NutritionSource = NutritionDataSource.Manual,
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
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_Vitamins = "",
                NutritionSource = NutritionDataSource.Manual,
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
                NutritionPer100_MonounsaturatedFatGrams = (decimal?)0m,
                NutritionPer100_PolyunsaturatedFatGrams = (decimal?)0.1m,
                NutritionPer100_Vitamins = "VitaminC",
                NutritionSource = NutritionDataSource.Manual,
                Color = "#f9dc5c"
            }
        );

        modelBuilder.Entity<IngredientTagAssignment>().HasData(
            new
            {
                IngredientId = 1,
                Tag = "Chicken"
            },
            new
            {
                IngredientId = 2,
                Tag = "Vegetable"
            },
            new
            {
                IngredientId = 3,
                Tag = "Dairy"
            },
            new
            {
                IngredientId = 4,
                Tag = "Grain"
            },
            new
            {
                IngredientId = 5,
                Tag = "Fruit"
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
                Amount = (decimal?)3m,
                Unit = MeasurementUnit.Gram
            },
            new
            {
                RecipeIngredientId = 3,
                RecipeId = 1,
                IngredientId = 5,
                Amount = (decimal?)30m,
                Unit = MeasurementUnit.Gram
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

    private static IReadOnlyCollection<object> CreateNutritionReferenceProfiles()
    {
        var importedAt = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero);
        return NutritionReferenceDefaults.Profiles
            .Select((profile, index) => new
            {
                NutritionReferenceProfileId = index + 1,
                profile.ProfileId,
                profile.Label,
                profile.Gender,
                profile.MinAge,
                profile.MaxAge,
                SourceUrl = NutritionReferenceDefaults.SourceUrl,
                SourceUpdatedAt = (DateTimeOffset?)null,
                ImportedAt = importedAt
            })
            .ToList<object>();
    }

    private static IReadOnlyCollection<object> CreateNutritionReferenceValues()
    {
        var valueId = 1;
        var values = new List<object>();
        foreach (var profile in NutritionReferenceDefaults.Profiles.Select((profile, index) => new
        {
            Profile = profile,
            ProfileId = index + 1
        }))
        {
            foreach (var value in profile.Profile.Values)
            {
                values.Add(new
                {
                    NutritionReferenceValueId = valueId++,
                    NutritionReferenceProfileId = profile.ProfileId,
                    value.NutrientKey,
                    value.Label,
                    value.DailyAmount,
                    value.Unit,
                    ValueType = NutritionReferenceValueType.ManualFallback
                });
            }
        }

        return values;
    }
}
