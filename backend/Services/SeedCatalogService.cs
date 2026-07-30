using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DinnerPlanner.Api.Services;

public class SeedCatalogService(
    DinnerPlannerContext context,
    IWebHostEnvironment environment,
    ILogger<SeedCatalogService> logger,
    TagCatalogService tagCatalog,
    ImageStoragePathProvider imageStorage)
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
        var startedAt = DateTimeOffset.UtcNow;
        try
        {
            var brandCount = await UpsertBrandsAsync(catalog.Brands, cancellationToken);
            var ingredientCount = await UpsertIngredientsAsync(catalog.Ingredients, cancellationToken);
            var recipeCount = await UpsertRecipesAsync(catalog.Recipes, cancellationToken);

            if (brandCount + ingredientCount + recipeCount > 0)
            {
                context.DataImportRuns.Add(new DataImportRun
                {
                    Source = "SeedCatalog",
                    Status = "Completed",
                    StartedAt = startedAt,
                    CompletedAt = DateTimeOffset.UtcNow,
                    BrandCount = brandCount,
                    IngredientCount = ingredientCount,
                    RecipeCount = recipeCount
                });
                await context.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception exception)
        {
            context.DataImportRuns.Add(new DataImportRun
            {
                Source = "SeedCatalog",
                Status = "Failed",
                StartedAt = startedAt,
                CompletedAt = DateTimeOffset.UtcNow,
                Message = exception.Message,
                BrandCount = catalog.Brands?.Count ?? 0,
                IngredientCount = catalog.Ingredients?.Count ?? 0,
                RecipeCount = catalog.Recipes?.Count ?? 0
            });
            await context.SaveChangesAsync(cancellationToken);
            throw;
        }
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
                .ThenInclude(tag => tag.TagDefinition)
            .OrderBy(ingredient => ingredient.IngredientName)
            .ThenBy(ingredient => ingredient.Brand == null ? "" : ingredient.Brand.Name)
            .Select(ingredient => new SeedIngredientDto(
                ingredient.IngredientName,
                ingredient.Description,
                ingredient.Brand == null ? null : ingredient.Brand.Name,
                ingredient.ImageUrl,
                ingredient.Price,
                ingredient.Tags.Select(tag => tag.TagDefinition.Name).OrderBy(tag => tag).ToList(),
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
                .ThenInclude(tag => tag.TagDefinition)
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

    public async Task ImportCatalogStreamAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        var catalog = await JsonSerializer.DeserializeAsync<SeedCatalogDto>(stream, jsonOptions, cancellationToken);
        if (catalog is null)
        {
            throw new InvalidOperationException("Seed catalog file was empty or invalid.");
        }

        await ImportCatalogAsync(catalog, cancellationToken);
    }

    public async Task<byte[]> BuildExportPackageAsync(CancellationToken cancellationToken = default)
    {
        var catalog = await ExportCatalogAsync(cancellationToken);
        await using var packageStream = new MemoryStream();
        using (var archive = new ZipArchive(packageStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            var catalogEntry = archive.CreateEntry("seed-catalog.json", CompressionLevel.Optimal);
            await using (var catalogStream = catalogEntry.Open())
            await using (var writer = new StreamWriter(catalogStream))
            {
                await writer.WriteAsync(Serialize(catalog));
            }

            if (Directory.Exists(imageStorage.RootPath))
            {
                foreach (var imagePath in Directory.EnumerateFiles(imageStorage.RootPath, "*", SearchOption.AllDirectories))
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var relativePath = Path.GetRelativePath(imageStorage.RootPath, imagePath).Replace('\\', '/');
                    var entry = archive.CreateEntry($"images/{relativePath}", CompressionLevel.Optimal);
                    await using var entryStream = entry.Open();
                    await using var imageStream = File.OpenRead(imagePath);
                    await imageStream.CopyToAsync(entryStream, cancellationToken);
                }
            }
        }

        return packageStream.ToArray();
    }

    private async Task<int> UpsertBrandsAsync(
        IReadOnlyCollection<SeedBrandDto>? brands,
        CancellationToken cancellationToken)
    {
        if (brands is null)
        {
            return 0;
        }

        var createdCount = 0;
        foreach (var brand in brands)
        {
            var (_, wasCreated) = await GetOrCreateBrandAsync(brand.Name, cancellationToken);
            if (wasCreated)
            {
                createdCount++;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        return createdCount;
    }

    private async Task<int> UpsertIngredientsAsync(
        IReadOnlyCollection<SeedIngredientDto>? ingredients,
        CancellationToken cancellationToken)
    {
        if (ingredients is null)
        {
            return 0;
        }

        var createdCount = 0;
        foreach (var seedIngredient in ingredients)
        {
            var name = CleanName(seedIngredient.IngredientName);
            if (name.Length == 0)
            {
                continue;
            }

            var (brand, _) = await GetOrCreateBrandAsync(seedIngredient.BrandName, cancellationToken);
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
                Tags = (await tagCatalog.NormalizeKnownTagDefinitionsAsync(seedIngredient.Tags, cancellationToken))
                    .Select(tag => new IngredientTagAssignment
                    {
                        IngredientTagDefinitionId = tag.IngredientTagDefinitionId
                    })
                    .ToList()
            });
            createdCount++;
        }

        await context.SaveChangesAsync(cancellationToken);
        return createdCount;
    }

    private async Task<int> UpsertRecipesAsync(
        IReadOnlyCollection<SeedRecipeDto>? recipes,
        CancellationToken cancellationToken)
    {
        if (recipes is null)
        {
            return 0;
        }

        var createdCount = 0;
        foreach (var seedRecipe in recipes)
        {
            var name = CleanName(seedRecipe.Name);
            if (name.Length == 0 || await RecipeExistsAsync(name, cancellationToken))
            {
                continue;
            }

            var recipe = CreateRecipe(seedRecipe, name);
            recipe.Tags = (await tagCatalog.NormalizeKnownTagDefinitionsAsync(seedRecipe.Tags, cancellationToken))
                .Select(tag => new RecipeTagAssignment
                {
                    IngredientTagDefinitionId = tag.IngredientTagDefinitionId
                })
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
            createdCount++;
        }

        await context.SaveChangesAsync(cancellationToken);
        await UpsertRecipeComponentsAsync(recipes, cancellationToken);
        return createdCount;
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

            var parentRecipe = await FindRecipeByNameAsync(parentName, cancellationToken);
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

                var childRecipe = await FindRecipeByNameAsync(childName, cancellationToken);
                if (childRecipe is null || childRecipe.RecipeId == parentRecipe.RecipeId)
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

    private async Task<(Brand? Brand, bool WasCreated)> GetOrCreateBrandAsync(string? name, CancellationToken cancellationToken)
    {
        var cleanName = CleanName(name);
        if (cleanName.Length == 0)
        {
            return (null, false);
        }

        var existing = await context.Brands
            .FirstOrDefaultAsync(brand => brand.Name.ToLower() == cleanName.ToLower(), cancellationToken);
        if (existing is not null)
        {
            return (existing, false);
        }

        var brand = new Brand { Name = cleanName };
        context.Brands.Add(brand);
        await context.SaveChangesAsync(cancellationToken);
        return (brand, true);
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

    private Task<bool> RecipeExistsAsync(string name, CancellationToken cancellationToken) =>
        context.Recipes
            .AsNoTracking()
            .AnyAsync(recipe => recipe.Name.ToLower() == name.ToLower(), cancellationToken);

    private Task<Recipe?> FindRecipeByNameAsync(string name, CancellationToken cancellationToken)
    {
        var cleanName = CleanName(name);
        return context.Recipes
            .FirstOrDefaultAsync(recipe => recipe.Name.ToLower() == cleanName.ToLower(), cancellationToken);
    }

    private static Recipe CreateRecipe(SeedRecipeDto seedRecipe, string name)
    {
        var recipe = new Recipe();

        recipe.Name = name;
        recipe.ImageUrl = NullIfWhiteSpace(seedRecipe.ImageUrl);
        recipe.Description = NullIfWhiteSpace(seedRecipe.Description);
        recipe.Instructions = NullIfWhiteSpace(seedRecipe.Instructions);
        recipe.Portions = seedRecipe.Portions is > 0m ? seedRecipe.Portions.Value : 1m;
        return recipe;
    }

    private static SeedRecipeDto ToSeedRecipe(Recipe recipe) => new(
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
        recipe.Tags.Select(recipeTag => recipeTag.TagDefinition.Name).OrderBy(tag => tag).ToList(),
        recipe.Components
            .OrderBy(component => component.SortOrder)
            .Select(component => new SeedRecipeComponentDto(
                component.ChildRecipe.Name,
                component.Amount,
                component.Unit,
                component.Preparation,
                component.SortOrder
            ))
            .ToList()
    );

    private static string CleanName(string? value) => value?.Trim() ?? string.Empty;

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
