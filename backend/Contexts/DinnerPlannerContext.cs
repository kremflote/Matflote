// MATFLOTE: EF Core database map for MATFLOTE entities, relationships, owned nutrition fields, and seeded defaults.
// Note: This file is intentionally dense because EF configuration, seed data, and compatibility mappings need to stay in one model snapshot source.

using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace DinnerPlanner.Api.Contexts;

public class DinnerPlannerContext(DbContextOptions<DinnerPlannerContext> options) : DbContext(options)
{
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<AssistantWriteLog> AssistantWriteLogs => Set<AssistantWriteLog>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<ConversionRule> ConversionRules => Set<ConversionRule>();
    public DbSet<DataImportRun> DataImportRuns => Set<DataImportRun>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<IngredientTagCategory> IngredientTagCategories => Set<IngredientTagCategory>();
    public DbSet<IngredientTagDefinition> IngredientTagDefinitions => Set<IngredientTagDefinition>();
    public DbSet<IngredientTagAssignment> IngredientTagAssignments => Set<IngredientTagAssignment>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeComponent> RecipeComponents => Set<RecipeComponent>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<RecipeTagAssignment> RecipeTagAssignments => Set<RecipeTagAssignment>();
    public DbSet<UploadedImage> UploadedImages => Set<UploadedImage>();
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
            entity.Property(setting => setting.Value).HasMaxLength(8000);
        });

        modelBuilder.Entity<AssistantWriteLog>(entity =>
        {
            entity.Property(log => log.Endpoint).HasMaxLength(80);
            entity.Property(log => log.Summary).HasMaxLength(AssistantWriteLogService.SummaryMaxLength);
            entity.Property(log => log.Counts).HasMaxLength(1000);
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.Property(brand => brand.Name).HasMaxLength(120);
            entity.HasIndex(brand => brand.Name).IsUnique();
        });

        modelBuilder.Entity<DataImportRun>(entity =>
        {
            entity.Property(importRun => importRun.Source).HasMaxLength(120);
            entity.Property(importRun => importRun.Status).HasMaxLength(80);
            entity.Property(importRun => importRun.Message).HasMaxLength(1000);
            entity.HasIndex(importRun => importRun.StartedAt);
        });

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.Property(ingredient => ingredient.IngredientName).HasMaxLength(ValidationLimits.IngredientNameMaxLength);
            entity.Property(ingredient => ingredient.Description).HasMaxLength(600);
            entity.Property(ingredient => ingredient.ImageUrl).HasMaxLength(500);
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
                nutrition.Property(value => value.FatGrams).HasPrecision(8, 2);
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
                ingredientTag.IngredientTagDefinitionId
            });

            entity.HasOne(ingredientTag => ingredientTag.Ingredient)
                .WithMany(ingredient => ingredient.Tags)
                .HasForeignKey(ingredientTag => ingredientTag.IngredientId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ingredientTag => ingredientTag.TagDefinition)
                .WithMany()
                .HasForeignKey(ingredientTag => ingredientTag.IngredientTagDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IngredientTagCategory>(entity =>
        {
            entity.Property(category => category.Name).HasMaxLength(120);
            entity.Property(category => category.ShowForIngredients).HasDefaultValue(true);
            entity.Property(category => category.ShowForRecipes).HasDefaultValue(true);
            entity.HasIndex(category => category.Name).IsUnique();
            entity.HasMany(category => category.Tags)
                .WithOne(tag => tag.Category)
                .HasForeignKey(tag => tag.IngredientTagCategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IngredientTagDefinition>(entity =>
        {
            entity.Property(tag => tag.Name).HasMaxLength(64);
            entity.Property(tag => tag.IsSystemTag).HasDefaultValue(false);
            entity.Property(tag => tag.SystemKey).HasMaxLength(96);
            entity.HasIndex(tag => tag.Name).IsUnique();
            entity.HasIndex(tag => tag.SystemKey).IsUnique();
        });

        modelBuilder.Entity<UploadedImage>(entity =>
        {
            entity.Property(image => image.FileName).HasMaxLength(260);
            entity.Property(image => image.PublicUrl).HasMaxLength(500);
            entity.Property(image => image.RelativePath).HasMaxLength(500);
            entity.Property(image => image.Folder).HasMaxLength(80);
            entity.Property(image => image.Source).HasMaxLength(80);
            entity.Property(image => image.OriginalFileName).HasMaxLength(260);
            entity.Property(image => image.ContentType).HasMaxLength(120);
            entity.Property(image => image.ThumbnailUrl).HasMaxLength(500);
            entity.Property(image => image.ThumbnailRelativePath).HasMaxLength(500);
            entity.HasIndex(image => image.PublicUrl).IsUnique();
            entity.HasIndex(image => image.CreatedAt);
        });

        modelBuilder.Entity<ConversionRule>(entity =>
        {
            entity.Property(rule => rule.FromText).HasMaxLength(120);
            entity.Property(rule => rule.ToText).HasMaxLength(120);
            entity.Property(rule => rule.FromTextNb).HasMaxLength(120);
            entity.Property(rule => rule.ToTextNb).HasMaxLength(120);
            entity.HasIndex(rule => rule.SortOrder);
        });

        modelBuilder.Entity<Recipe>(entity =>
        {
            entity.Property(recipe => recipe.Name).HasMaxLength(ValidationLimits.RecipeNameMaxLength);
            entity.Property(recipe => recipe.Description).HasMaxLength(600);
            entity.Property(recipe => recipe.RatingNote).HasMaxLength(ValidationLimits.RatingNoteMaxLength);

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

            entity.Property(component => component.Amount).HasPrecision(10, 2);
            entity.Property(component => component.Unit)
                .HasConversion<string>()
                .HasMaxLength(40)
                .HasDefaultValue(MeasurementUnit.Gram);
            entity.Property(component => component.Preparation)
                .HasConversion<string>()
                .HasMaxLength(40)
                .HasDefaultValue(IngredientPreparation.None);

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
                recipeTag.IngredientTagDefinitionId
            });

            entity.HasOne(recipeTag => recipeTag.Recipe)
                .WithMany(recipe => recipe.Tags)
                .HasForeignKey(recipeTag => recipeTag.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(recipeTag => recipeTag.TagDefinition)
                .WithMany()
                .HasForeignKey(recipeTag => recipeTag.IngredientTagDefinitionId)
                .OnDelete(DeleteBehavior.Cascade);
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
            entity.Property(planRecipe => planRecipe.Unit).HasConversion<string>().HasMaxLength(40);
            entity.Property(planRecipe => planRecipe.Portions).HasPrecision(10, 2);
            entity.Property(planRecipe => planRecipe.Amount).HasPrecision(10, 2);

            entity.HasOne(planRecipe => planRecipe.MealPlanEntry)
                .WithMany(entry => entry.Recipes)
                .HasForeignKey(planRecipe => planRecipe.MealPlanEntryId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(planRecipe => planRecipe.Recipe)
                .WithMany()
                .HasForeignKey(planRecipe => planRecipe.RecipeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(planRecipe => planRecipe.Ingredient)
                .WithMany()
                .HasForeignKey(planRecipe => planRecipe.IngredientId)
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
        modelBuilder.Entity<NutritionReferenceProfile>().HasData(CreateNutritionReferenceProfiles());
        modelBuilder.Entity<NutritionReferenceValue>().HasData(CreateNutritionReferenceValues());

        modelBuilder.Entity<ConversionRule>().HasData(
            new
            {
                ConversionRuleId = 1,
                FromText = "1 tsp",
                ToText = "5 ml / 5 g",
                FromTextNb = "1 ts",
                ToTextNb = "5 ml / 5 g",
                SortOrder = 100,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            },
            new
            {
                ConversionRuleId = 2,
                FromText = "1 tbsp",
                ToText = "15 ml / 15 g",
                FromTextNb = "1 ss",
                ToTextNb = "15 ml / 15 g",
                SortOrder = 200,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            },
            new
            {
                ConversionRuleId = 3,
                FromText = "1 cup",
                ToText = "240 ml / 240 g",
                FromTextNb = "1 kopp",
                ToTextNb = "240 ml / 240 g",
                SortOrder = 300,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            },
            new
            {
                ConversionRuleId = 4,
                FromText = "1 yellow onion",
                ToText = "170 g",
                FromTextNb = "1 gul løk",
                ToTextNb = "170 g",
                SortOrder = 400,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            },
            new
            {
                ConversionRuleId = 5,
                FromText = "1 garlic clove",
                ToText = "3 g",
                FromTextNb = "1 hvitløksfedd",
                ToTextNb = "3 g",
                SortOrder = 500,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            },
            new
            {
                ConversionRuleId = 6,
                FromText = "1 carrot",
                ToText = "70 g",
                FromTextNb = "1 gulrot",
                ToTextNb = "70 g",
                SortOrder = 600,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            },
            new
            {
                ConversionRuleId = 7,
                FromText = "1 egg",
                ToText = "60 g",
                FromTextNb = "1 egg",
                ToTextNb = "60 g",
                SortOrder = 700,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            },
            new
            {
                ConversionRuleId = 8,
                FromText = "1 broth cube",
                ToText = "10 g",
                FromTextNb = "1 kube med buljong",
                ToTextNb = "10 g",
                SortOrder = 800,
                CreatedAt = new DateTimeOffset(2026, 7, 31, 0, 0, 0, TimeSpan.Zero)
            }
        );

        modelBuilder.Entity<IngredientTagCategory>().HasData(
            new { IngredientTagCategoryId = 1, Name = "Produce", SortOrder = 100, ShowForIngredients = true, ShowForRecipes = true },
            new { IngredientTagCategoryId = 2, Name = "Protein", SortOrder = 200, ShowForIngredients = true, ShowForRecipes = true },
            new { IngredientTagCategoryId = 3, Name = "Pantry", SortOrder = 300, ShowForIngredients = true, ShowForRecipes = true }
        );

        modelBuilder.Entity<IngredientTagDefinition>().HasData(
            new { IngredientTagDefinitionId = 1, Name = "Vegetable", IngredientTagCategoryId = 1, SortOrder = 100 },
            new { IngredientTagDefinitionId = 2, Name = "Fruit", IngredientTagCategoryId = 1, SortOrder = 200 },
            new { IngredientTagDefinitionId = 3, Name = "Berry", IngredientTagCategoryId = 1, SortOrder = 300 },
            new { IngredientTagDefinitionId = 4, Name = "RootVegetable", IngredientTagCategoryId = 1, SortOrder = 400 },
            new { IngredientTagDefinitionId = 5, Name = "LeafyGreen", IngredientTagCategoryId = 1, SortOrder = 500 },
            new { IngredientTagDefinitionId = 6, Name = "Herb", IngredientTagCategoryId = 1, SortOrder = 600 },
            new { IngredientTagDefinitionId = 7, Name = "Chicken", IngredientTagCategoryId = 2, SortOrder = 100 },
            new { IngredientTagDefinitionId = 8, Name = "Fish", IngredientTagCategoryId = 2, SortOrder = 200 },
            new { IngredientTagDefinitionId = 9, Name = "Beef", IngredientTagCategoryId = 2, SortOrder = 300 },
            new { IngredientTagDefinitionId = 10, Name = "Lamb", IngredientTagCategoryId = 2, SortOrder = 400 },
            new { IngredientTagDefinitionId = 11, Name = "Mince", IngredientTagCategoryId = 2, SortOrder = 500 },
            new { IngredientTagDefinitionId = 12, Name = "Dairy", IngredientTagCategoryId = 2, SortOrder = 600 },
            new { IngredientTagDefinitionId = 13, Name = "Grain", IngredientTagCategoryId = 3, SortOrder = 100 },
            new { IngredientTagDefinitionId = 14, Name = "Bread", IngredientTagCategoryId = 3, SortOrder = 200 },
            new { IngredientTagDefinitionId = 15, Name = "Spice", IngredientTagCategoryId = 3, SortOrder = 300 },
            new { IngredientTagDefinitionId = 16, Name = "Sauce", IngredientTagCategoryId = 3, SortOrder = 400 },
            new { IngredientTagDefinitionId = 17, Name = "Dip", IngredientTagCategoryId = 3, SortOrder = 500 },
            new { IngredientTagDefinitionId = 19, Name = "Frozen", IngredientTagCategoryId = 3, SortOrder = 600 }
        );
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
