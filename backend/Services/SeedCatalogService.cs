using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DinnerPlanner.Api.Services;

public class SeedCatalogService(
    DinnerPlannerContext context,
    IWebHostEnvironment environment,
    ILogger<SeedCatalogService> logger)
{
    private readonly JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private string CatalogPath => Path.Combine(environment.ContentRootPath, "SeedData", "catalog.json");

    public async Task ImportConfiguredCatalogAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(CatalogPath))
        {
            logger.LogInformation("No seed catalog found at {CatalogPath}.", CatalogPath);
            return;
        }

        await using var stream = File.OpenRead(CatalogPath);
        var catalog = await JsonSerializer.DeserializeAsync<SeedCatalogDto>(stream, jsonOptions, cancellationToken);

        if (catalog is null)
        {
            logger.LogWarning("Seed catalog at {CatalogPath} was empty or invalid.", CatalogPath);
            return;
        }

        await ImportCatalogAsync(catalog, cancellationToken);
    }

    public async Task ImportCatalogAsync(SeedCatalogDto catalog, CancellationToken cancellationToken = default)
    {
        await UpsertBrandsAsync(catalog.Brands, cancellationToken);
        await UpsertIngredientsAsync(catalog.Ingredients, cancellationToken);
        await UpsertRecipesAsync(catalog.Recipes, cancellationToken);
    }

    public async Task<SeedCatalogDto> ExportCatalogAsync(CancellationToken cancellationToken = default)
    {
        var brands = await context.Brands
            .AsNoTracking()
            .OrderBy(brand => brand.Name)
            .Select(brand => new SeedBrandDto(brand.Name))
            .ToListAsync(cancellationToken);

        var ingredients = await context.Ingredients
            .AsNoTracking()
            .Include(ingredient => ingredient.Brand)
            .Include(ingredient => ingredient.Tags)
            .OrderBy(ingredient => ingredient.IngredientName)
            .ThenBy(ingredient => ingredient.Brand == null ? "" : ingredient.Brand.Name)
            .Select(ingredient => new SeedIngredientDto(
                ingredient.IngredientName,
                ingredient.Description,
                ingredient.Brand == null ? null : ingredient.Brand.Name,
                ingredient.ImageUrl,
                ingredient.Price,
                ingredient.Tags.Select(tag => tag.Tag).OrderBy(tag => tag).ToList(),
                ingredient.NutritionPer100,
                ingredient.NutritionSource,
                ingredient.NutritionSourceLabel,
                ingredient.MatvaretabellenFoodId,
                ingredient.NutritionMatchedName,
                ingredient.NutritionMatchConfidence,
                ingredient.Color
            ))
            .ToListAsync(cancellationToken);

        var recipes = await context.Recipes
            .AsNoTracking()
            .Include(recipe => recipe.Ingredients)
                .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                    .ThenInclude(ingredient => ingredient.Brand)
            .Include(recipe => recipe.Tags)
            .Include(recipe => recipe.Components)
                .ThenInclude(component => component.ChildRecipe)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync(cancellationToken);

        return new SeedCatalogDto(
            brands,
            ingredients,
            recipes.Select(ToSeedRecipe).ToList()
        );
    }

    public string Serialize(SeedCatalogDto catalog) => JsonSerializer.Serialize(catalog, jsonOptions);

    private async Task UpsertBrandsAsync(
        IReadOnlyCollection<SeedBrandDto>? brands,
        CancellationToken cancellationToken)
    {
        if (brands is null)
        {
            return;
        }

        foreach (var brand in brands)
        {
            await GetOrCreateBrandAsync(brand.Name, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task UpsertIngredientsAsync(
        IReadOnlyCollection<SeedIngredientDto>? ingredients,
        CancellationToken cancellationToken)
    {
        if (ingredients is null)
        {
            return;
        }

        foreach (var seedIngredient in ingredients)
        {
            var name = CleanName(seedIngredient.IngredientName);
            if (name.Length == 0)
            {
                continue;
            }

            var brand = await GetOrCreateBrandAsync(seedIngredient.BrandName, cancellationToken);
            var existing = await FindIngredientAsync(name, brand?.Name, cancellationToken);
            if (existing is not null)
            {
                continue;
            }

            context.Ingredients.Add(new Ingredient
            {
                IngredientName = name,
                Description = NullIfWhiteSpace(seedIngredient.Description),
                BrandId = brand?.BrandId,
                ImageUrl = NullIfWhiteSpace(seedIngredient.ImageUrl),
                Price = seedIngredient.Price,
                NutritionPer100 = seedIngredient.NutritionPer100,
                NutritionSource = seedIngredient.NutritionPer100 is null
                    ? NutritionDataSource.None
                    : seedIngredient.NutritionSource ?? NutritionDataSource.Manual,
                NutritionSourceLabel = NullIfWhiteSpace(seedIngredient.NutritionSourceLabel),
                MatvaretabellenFoodId = NullIfWhiteSpace(seedIngredient.MatvaretabellenFoodId),
                NutritionMatchedName = NullIfWhiteSpace(seedIngredient.NutritionMatchedName),
                NutritionMatchConfidence = seedIngredient.NutritionMatchConfidence,
                Color = NullIfWhiteSpace(seedIngredient.Color),
                Tags = NormalizeIngredientTags(seedIngredient.Tags)
                    .Select(tag => new IngredientTagAssignment { Tag = tag })
                    .ToList()
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task UpsertRecipesAsync(
        IReadOnlyCollection<SeedRecipeDto>? recipes,
        CancellationToken cancellationToken)
    {
        if (recipes is null)
        {
            return;
        }

        foreach (var seedRecipe in recipes)
        {
            var name = CleanName(seedRecipe.Name);
            if (name.Length == 0 || await RecipeExistsAsync(name, seedRecipe.RecipeType, cancellationToken))
            {
                continue;
            }

            var recipe = CreateRecipe(seedRecipe, name);
            recipe.Tags = NormalizeRecipeTags(seedRecipe.Tags)
                .Select(tag => new RecipeTagAssignment { Tag = tag })
                .ToList();

            foreach (var seedIngredient in seedRecipe.Ingredients ?? [])
            {
                var ingredientName = CleanName(seedIngredient.IngredientName);
                if (ingredientName.Length == 0)
                {
                    continue;
                }

                var ingredient = await FindIngredientAsync(ingredientName, seedIngredient.BrandName, cancellationToken)
                    ?? await FindIngredientAsync(ingredientName, null, cancellationToken);

                if (ingredient is null)
                {
                    logger.LogWarning(
                        "Seed recipe {RecipeName} references missing ingredient {IngredientName}.",
                        name,
                        ingredientName);
                    continue;
                }

                recipe.Ingredients.Add(new RecipeIngredient
                {
                    IngredientId = ingredient.IngredientId,
                    Amount = seedIngredient.Amount,
                    Unit = Enum.IsDefined(seedIngredient.Unit) ? seedIngredient.Unit : MeasurementUnit.Gram,
                    Preparation = Enum.IsDefined(seedIngredient.Preparation)
                        ? seedIngredient.Preparation
                        : IngredientPreparation.None
                });
            }

            context.Recipes.Add(recipe);
        }

        await context.SaveChangesAsync(cancellationToken);
        await UpsertRecipeComponentsAsync(recipes, cancellationToken);
    }

    private async Task UpsertRecipeComponentsAsync(
        IReadOnlyCollection<SeedRecipeDto> recipes,
        CancellationToken cancellationToken)
    {
        foreach (var seedRecipe in recipes)
        {
            var parentName = CleanName(seedRecipe.Name);
            if (parentName.Length == 0 || seedRecipe.Components is null)
            {
                continue;
            }

            var parentRecipe = await FindRecipeAsync(parentName, seedRecipe.RecipeType, cancellationToken);
            if (parentRecipe is null)
            {
                continue;
            }

            await context.Entry(parentRecipe).Collection(recipe => recipe.Components).LoadAsync(cancellationToken);
            context.RecipeComponents.RemoveRange(parentRecipe.Components);
            parentRecipe.Components.Clear();

            foreach (var seedComponent in seedRecipe.Components)
            {
                var childName = CleanName(seedComponent.RecipeName);
                if (childName.Length == 0)
                {
                    continue;
                }

                var childRecipe = await FindRecipeAsync(childName, seedComponent.RecipeType, cancellationToken)
                    ?? await FindRecipeByNameAsync(childName, cancellationToken);
                if (childRecipe is null || childRecipe.RecipeId == parentRecipe.RecipeId || childRecipe is Dish or Dessert)
                {
                    continue;
                }

                parentRecipe.Components.Add(new RecipeComponent
                {
                    ParentRecipeId = parentRecipe.RecipeId,
                    ChildRecipeId = childRecipe.RecipeId,
                    Amount = seedComponent.Amount is > 0m ? seedComponent.Amount.Value : 1m,
                    Unit = seedComponent.Unit ?? MeasurementUnit.Gram,
                    Preparation = seedComponent.Preparation ?? IngredientPreparation.None,
                    SortOrder = seedComponent.SortOrder ?? parentRecipe.Components.Count + 1
                });
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task<Brand?> GetOrCreateBrandAsync(string? name, CancellationToken cancellationToken)
    {
        var cleanName = CleanName(name);
        if (cleanName.Length == 0)
        {
            return null;
        }

        var existing = await context.Brands
            .FirstOrDefaultAsync(brand => brand.Name.ToLower() == cleanName.ToLower(), cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var brand = new Brand { Name = cleanName };
        context.Brands.Add(brand);
        await context.SaveChangesAsync(cancellationToken);
        return brand;
    }

    private Task<Ingredient?> FindIngredientAsync(
        string ingredientName,
        string? brandName,
        CancellationToken cancellationToken)
    {
        var cleanName = CleanName(ingredientName);
        var cleanBrand = CleanName(brandName);

        return context.Ingredients
            .Include(ingredient => ingredient.Brand)
            .FirstOrDefaultAsync(
                ingredient =>
                    ingredient.IngredientName.ToLower() == cleanName.ToLower() &&
                    (cleanBrand.Length == 0
                        ? ingredient.BrandId == null
                        : ingredient.Brand != null && ingredient.Brand.Name.ToLower() == cleanBrand.ToLower()),
                cancellationToken);
    }

    private async Task<bool> RecipeExistsAsync(
        string name,
        RecipeType recipeType,
        CancellationToken cancellationToken)
    {
        var matchingRecipes = await context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.Name.ToLower() == name.ToLower())
            .ToListAsync(cancellationToken);

        return matchingRecipes.Any(recipe => ToRecipeType(recipe) == recipeType);
    }

    private async Task<Recipe?> FindRecipeAsync(
        string name,
        RecipeType? recipeType,
        CancellationToken cancellationToken)
    {
        var cleanName = CleanName(name);
        var matchingRecipes = await context.Recipes
            .Where(recipe => recipe.Name.ToLower() == cleanName.ToLower())
            .ToListAsync(cancellationToken);

        return recipeType is null
            ? matchingRecipes.FirstOrDefault()
            : matchingRecipes.FirstOrDefault(recipe => ToRecipeType(recipe) == recipeType.Value);
    }

    private Task<Recipe?> FindRecipeByNameAsync(string name, CancellationToken cancellationToken)
    {
        var cleanName = CleanName(name);
        return context.Recipes
            .FirstOrDefaultAsync(recipe => recipe.Name.ToLower() == cleanName.ToLower(), cancellationToken);
    }

    private static Recipe CreateRecipe(SeedRecipeDto seedRecipe, string name)
    {
        Recipe recipe = seedRecipe.RecipeType switch
        {
            RecipeType.Dish => new Dish(),
            RecipeType.Dessert => new Dessert { Type = seedRecipe.DessertType ?? DessertType.Other },
            RecipeType.Sauce => new Sauce(),
            RecipeType.Dip => new Dip(),
            RecipeType.Side => new Side(),
            RecipeType.SpiceMix => new SpiceMix(),
            _ => new Dish()
        };

        recipe.Name = name;
        recipe.ImageUrl = NullIfWhiteSpace(seedRecipe.ImageUrl);
        recipe.Description = NullIfWhiteSpace(seedRecipe.Description);
        recipe.Instructions = NullIfWhiteSpace(seedRecipe.Instructions);
        recipe.Portions = seedRecipe.Portions is > 0m ? seedRecipe.Portions.Value : 1m;
        return recipe;
    }

    private static SeedRecipeDto ToSeedRecipe(Recipe recipe) => new(
        ToRecipeType(recipe),
        recipe.Name,
        recipe.ImageUrl,
        recipe.Description,
        recipe.Instructions,
        recipe.Portions,
        recipe.Ingredients
            .OrderBy(recipeIngredient => recipeIngredient.Ingredient.IngredientName)
            .Select(recipeIngredient => new SeedRecipeIngredientDto(
                recipeIngredient.Ingredient.IngredientName,
                recipeIngredient.Ingredient.Brand?.Name,
                recipeIngredient.Amount,
                recipeIngredient.Unit,
                recipeIngredient.Preparation
            ))
            .ToList(),
        recipe.Tags.Select(recipeTag => recipeTag.Tag).OrderBy(tag => tag).ToList(),
        recipe.Components
            .OrderBy(component => component.SortOrder)
            .Select(component => new SeedRecipeComponentDto(
                component.ChildRecipe.Name,
                ToRecipeType(component.ChildRecipe),
                component.Amount,
                component.Unit,
                component.Preparation,
                component.SortOrder
            ))
            .ToList(),
        recipe is Dessert dessert ? dessert.Type : null
    );

    private static RecipeType ToRecipeType(Recipe recipe) => recipe switch
    {
        Dish => RecipeType.Dish,
        Dessert => RecipeType.Dessert,
        Sauce => RecipeType.Sauce,
        Dip => RecipeType.Dip,
        Side => RecipeType.Side,
        SpiceMix => RecipeType.SpiceMix,
        _ => RecipeType.Dish
    };

    private static List<string> NormalizeIngredientTags(IReadOnlyCollection<string>? tags) =>
        tags is null || tags.Count == 0
            ? []
            : tags
                .Select(tag => tag.Trim())
                .Where(tag => tag.Length > 0 && tag.Length <= 64)
                .Distinct()
                .ToList();

    private static List<string> NormalizeRecipeTags(IReadOnlyCollection<string>? tags) =>
        tags is null || tags.Count == 0
            ? []
            : tags
                .Select(tag => tag.Trim())
                .Where(tag => tag.Length > 0 && tag.Length <= 64)
                .Distinct()
                .ToList();

    private static string CleanName(string? value) => value?.Trim() ?? string.Empty;

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
