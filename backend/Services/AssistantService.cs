// MATFLOTE: Name-based catalog and meal-plan operations for AI agents and scripts (the /api/assistant surface).
// Note: Every write validates the whole request first and reports all problems at once; nothing is saved unless the request is clean.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using static DinnerPlanner.Api.Services.CatalogNames;

namespace DinnerPlanner.Api.Services;

public class AssistantService(
    DinnerPlannerContext context,
    MealPlanWriter mealPlanWriter,
    PlanningPreferencesService planningPreferences,
    AssistantWriteLogService writeLog,
    MatvaretabellenNutritionLookupService matvaretabellen,
    AssistantImageDownloader imageDownloader,
    ImageStoragePathProvider imageStorage)
{
    private const int DefaultHistoryDays = 56;
    private const int MaxHistoryDays = 366;
    private const int MaxRangeDays = 62;
    private const int MaxReadRangeDays = 366;
    private const decimal MaxNutrientValue = 100_000m;

    /// <summary>
    /// The lowest Matvaretabellen confidence attached without a person looking at it. The search dialog in the web
    /// app suggests from 0.52; values attached unattended need a clearer match.
    /// </summary>
    public const decimal NutritionMatchThreshold = 0.70m;

    private const string AssistantTagHint = "Tags must already exist; see tagCategories in GET /api/assistant/context.";
    private const string ModeSkip = "skip";
    private const string ModeUpdate = "update";
    private const string ModeError = "error";
    private const string ModeReplace = "replace";
    private const string ModeFill = "fill";

    // ---------- Context ----------

    public async Task<AssistantContextDto> GetContextAsync(int? historyDays, CancellationToken cancellationToken)
    {
        var history = Math.Clamp(historyDays ?? DefaultHistoryDays, 1, MaxHistoryDays);
        var today = DateOnly.FromDateTime(DateTime.Now);
        var historyStart = today.AddDays(-history);

        var tagCategories = await context.IngredientTagCategories
            .AsNoTracking()
            .Include(category => category.Tags)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .ToListAsync(cancellationToken);

        var conversionRules = await context.ConversionRules
            .AsNoTracking()
            .OrderBy(rule => rule.SortOrder)
            .Select(rule => new AssistantConversionRuleDto(rule.FromText, rule.ToText))
            .ToListAsync(cancellationToken);

        var ingredients = await context.Ingredients
            .AsNoTracking()
            .AsSplitQuery()
            .Include(ingredient => ingredient.Brand)
            .Include(ingredient => ingredient.Tags)
                .ThenInclude(tag => tag.TagDefinition)
            .OrderBy(ingredient => ingredient.IngredientName)
            .ToListAsync(cancellationToken);

        var recipes = await context.Recipes
            .AsNoTracking()
            .AsSplitQuery()
            .Include(recipe => recipe.Ingredients)
                .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
            .Include(recipe => recipe.Tags)
                .ThenInclude(tag => tag.TagDefinition)
            .Include(recipe => recipe.Components)
                .ThenInclude(component => component.ChildRecipe)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync(cancellationToken);

        var plannedDates = await context.MealPlanRecipes
            .AsNoTracking()
            .Where(item => item.RecipeId != null)
            .Select(item => new { RecipeId = item.RecipeId!.Value, item.MealPlanEntry.Date })
            .ToListAsync(cancellationToken);
        var usageByRecipe = plannedDates
            .Where(item => item.Date <= today)
            .GroupBy(item => item.RecipeId)
            .ToDictionary(
                group => group.Key,
                group => (Count: group.Count(item => item.Date >= historyStart), Last: group.Max(item => item.Date)));
        // The first time each recipe is planned after today, so "not planned recently" can include the rest of this week.
        var nextByRecipe = plannedDates
            .Where(item => item.Date > today)
            .GroupBy(item => item.RecipeId)
            .ToDictionary(group => group.Key, group => group.Min(item => item.Date));

        return new AssistantContextDto(
            today,
            StartOfWeek(today),
            history,
            await planningPreferences.GetAsync(cancellationToken),
            new AssistantVocabularyDto(
                AssistantUnits.CanonicalUnits,
                AssistantUnits.AliasDescriptions,
                Enum.GetNames<IngredientPreparation>().Where(name => name != nameof(IngredientPreparation.None)).ToList(),
                Enum.GetNames<MealSlot>(),
                Enum.GetNames<MealRecipeRole>(),
                new AssistantLimitsDto(
                    ValidationLimits.RecipeNameMaxLength,
                    ValidationLimits.IngredientNameMaxLength,
                    ValidationLimits.DescriptionMaxLength,
                    ValidationLimits.MealNotesMaxLength)),
            tagCategories
                .Select(category => new AssistantTagCategoryDto(
                    category.Name,
                    category.ShowForIngredients,
                    category.ShowForRecipes,
                    category.Tags.OrderBy(tag => tag.SortOrder).ThenBy(tag => tag.Name).Select(tag => tag.Name).ToList()))
                .ToList(),
            conversionRules,
            ingredients
                .Select(ingredient => new AssistantIngredientSummaryDto(
                    ingredient.IngredientId,
                    ingredient.IngredientName,
                    ingredient.Brand?.Name,
                    ingredient.Tags.Select(tag => tag.TagDefinition.Name).Order().ToList(),
                    ingredient.NutritionPer100?.Calories is not null))
                .ToList(),
            recipes
                .Select(recipe =>
                {
                    usageByRecipe.TryGetValue(recipe.RecipeId, out var usage);
                    return new AssistantRecipeSummaryDto(
                        recipe.RecipeId,
                        recipe.Name,
                        recipe.Portions,
                        recipe.Tags.Select(tag => tag.TagDefinition.Name).Order().ToList(),
                        recipe.Ingredients.Select(line => line.Ingredient.IngredientName).Order().ToList(),
                        recipe.Components.Count == 0
                            ? null
                            : recipe.Components.OrderBy(component => component.SortOrder).Select(component => component.ChildRecipe.Name).ToList(),
                        usage.Count,
                        usage.Count == 0 && usage.Last == default ? null : usage.Last,
                        nextByRecipe.TryGetValue(recipe.RecipeId, out var next) ? next : null,
                        recipe.Rating,
                        recipe.RatingNote);
                })
                .ToList());
    }

    // ---------- Recipes ----------

    public async Task<AssistantRecipeDocumentDto?> GetRecipeAsync(int id, CancellationToken cancellationToken)
    {
        var recipe = await context.Recipes
            .AsNoTracking()
            .AsSplitQuery()
            .Include(value => value.Ingredients)
                .ThenInclude(line => line.Ingredient)
                    .ThenInclude(ingredient => ingredient.Brand)
            .Include(value => value.Tags)
                .ThenInclude(tag => tag.TagDefinition)
            .Include(value => value.Components)
                .ThenInclude(component => component.ChildRecipe)
            .FirstOrDefaultAsync(value => value.RecipeId == id, cancellationToken);

        if (recipe is null)
        {
            return null;
        }

        return new AssistantRecipeDocumentDto(
            recipe.RecipeId,
            recipe.Name,
            recipe.Description,
            recipe.Instructions,
            recipe.ImageUrl,
            recipe.Portions,
            recipe.Tags.Select(tag => tag.TagDefinition.Name).Order().ToList(),
            recipe.Ingredients
                .OrderBy(line => line.RecipeIngredientId)
                .Select(line => new AssistantRecipeIngredientDocumentDto(
                    line.Ingredient.IngredientName,
                    line.Ingredient.Brand?.Name,
                    line.Amount,
                    AssistantUnits.ToShort(line.Unit),
                    line.Preparation == IngredientPreparation.None ? null : line.Preparation.ToString()))
                .ToList(),
            recipe.Components
                .OrderBy(component => component.SortOrder)
                .Select(component => new AssistantRecipeComponentDocumentDto(
                    component.ChildRecipe.Name,
                    component.Amount,
                    AssistantUnits.ToShort(component.Unit),
                    component.Preparation == IngredientPreparation.None ? null : component.Preparation.ToString()))
                .ToList());
    }

    public async Task<AssistantImportResultDto> ImportAsync(AssistantImportRequest request, CancellationToken cancellationToken)
    {
        var dryRun = request.DryRun ?? false;
        var requestErrors = new List<string>();
        var recipeMode = ParseOption(request.OnExistingRecipe, ModeSkip, [ModeSkip, ModeUpdate, ModeError], "onExistingRecipe", requestErrors);
        var ingredientMode = ParseOption(request.OnExistingIngredient, ModeSkip, [ModeSkip, ModeUpdate], "onExistingIngredient", requestErrors);
        var createMissingIngredients = request.CreateMissingIngredients ?? true;

        if ((request.Ingredients?.Count ?? 0) == 0 && (request.Recipes?.Count ?? 0) == 0)
        {
            requestErrors.Add("Nothing to import: provide at least one entry in \"recipes\" or \"ingredients\".");
        }

        var tags = await TagIndex.LoadAsync(context, cancellationToken);
        var catalog = new IngredientCatalog(
            await context.Ingredients
                .Include(ingredient => ingredient.Brand)
                .Include(ingredient => ingredient.Tags)
                .ToListAsync(cancellationToken),
            await context.Brands.ToListAsync(cancellationToken));
        var storedRecipes = await context.Recipes
            .AsSplitQuery()
            .Include(recipe => recipe.Ingredients)
            .Include(recipe => recipe.Tags)
            .Include(recipe => recipe.Components)
            .ToListAsync(cancellationToken);

        // Changes are collected here and only run once the whole request has validated.
        var pendingChanges = new List<Action>();
        var ingredientResults = new List<ItemResult>();
        var recipeResults = new List<ItemResult>();

        PlanIngredientDefinitions(request.Ingredients ?? [], ingredientMode, tags, catalog, ingredientResults, pendingChanges);
        var recipePlans = PlanRecipes(
            request.Recipes ?? [],
            recipeMode,
            createMissingIngredients,
            tags,
            catalog,
            storedRecipes,
            ingredientResults,
            recipeResults,
            pendingChanges);

        var hasErrors = requestErrors.Count > 0
            || ingredientResults.Any(result => result.Errors.Count > 0)
            || recipeResults.Any(result => result.Errors.Count > 0);
        var applied = !dryRun && !hasErrors;

        // Images are fetched before anything is written, so a bad URL rejects the request like any other error.
        if (requestErrors.Count == 0 && recipePlans.Any(plan => plan.ImageDownload is not null))
        {
            await DownloadImagesAsync(recipePlans, cancellationToken);
            hasErrors = recipeResults.Any(result => result.Errors.Count > 0) || hasErrors;
            applied = !dryRun && !hasErrors;
        }

        // Looked up for a dry run too, so it shows what would be attached; skipped for a request that is rejected anyway.
        if ((request.LookupNutrition ?? false) && (dryRun || applied))
        {
            await LookUpNutritionAsync(ingredientResults, cancellationToken);
        }
        else
        {
            foreach (var result in ingredientResults.Where(result => result.Created is { NutritionPer100: null }))
            {
                result.Warnings.Add("It has no nutrition data, so the Nutrition page has a gap. Send nutritionPer100, or \"lookupNutrition\": true to look it up.");
            }
        }

        if (applied)
        {
            foreach (var plan in recipePlans.Where(plan => plan.DownloadedImage is not null))
            {
                var image = await imageDownloader.SaveAsync(plan.DownloadedImage!, cancellationToken);
                context.UploadedImages.Add(image);
                plan.ImageUrl = image.PublicUrl;
                plan.Result.ImageUrl = image.PublicUrl;
            }

            foreach (var change in pendingChanges)
            {
                change();
            }

            writeLog.Add(
                AssistantWriteLogService.ImportEndpoint,
                DescribeImport(ingredientResults, recipeResults),
                new Dictionary<string, int>
                {
                    ["recipesCreated"] = recipeResults.Count(result => result.Status == ItemStatus.Create),
                    ["recipesUpdated"] = recipeResults.Count(result => result.Status == ItemStatus.Update),
                    ["recipesSkipped"] = recipeResults.Count(result => result.Status == ItemStatus.Skip),
                    ["ingredientsCreated"] = ingredientResults.Count(result => result.Status == ItemStatus.Create),
                    ["ingredientsUpdated"] = ingredientResults.Count(result => result.Status == ItemStatus.Update),
                    ["ingredientsSkipped"] = ingredientResults.Count(result => result.Status == ItemStatus.Skip),
                });
            await context.SaveChangesAsync(cancellationToken);
            await writeLog.PruneAsync(cancellationToken);
        }

        return new AssistantImportResultDto(
            dryRun,
            applied,
            requestErrors,
            ingredientResults.Select(result => result.ToDto(applied)).ToList(),
            recipeResults.Select(result => result.ToDto(applied)).ToList());
    }

    private void PlanIngredientDefinitions(
        IReadOnlyCollection<AssistantIngredientInput> inputs,
        string mode,
        TagIndex tags,
        IngredientCatalog catalog,
        List<ItemResult> results,
        List<Action> pendingChanges)
    {
        var seenKeys = new HashSet<string>();

        foreach (var input in inputs)
        {
            var name = Clean(input.Name);
            var brandName = NullIfEmpty(Clean(input.Brand));
            var result = new ItemResult(DescribeIngredient(name, brandName));
            results.Add(result);

            ValidateIngredientName(name, result.Errors);
            if (!seenKeys.Add($"{Key(name)}|{Key(brandName)}"))
            {
                result.Errors.Add("This ingredient is listed more than once in the request.");
            }

            var description = NullIfEmpty(input.Description?.Trim());
            if (description?.Length > ValidationLimits.DescriptionMaxLength)
            {
                result.Errors.Add($"description is {description.Length} characters; the maximum is {ValidationLimits.DescriptionMaxLength}.");
            }

            var color = NullIfEmpty(input.Color?.Trim());
            if (color is not null && !IsHexColor(color))
            {
                result.Errors.Add($"color \"{color}\" must be a hex colour such as \"#f28c28\".");
            }

            var nutrition = ToNutritionFacts(input.NutritionPer100, result.Errors);
            var tagDefinitions = input.Tags is null ? null : tags.Resolve(input.Tags, TagUse.Ingredient, result.Errors, result.Warnings, AssistantTagHint);

            if (result.Errors.Count > 0)
            {
                continue;
            }

            var existing = catalog.FindExact(name, brandName);
            if (existing is null)
            {
                var ingredient = catalog.Create(name, brandName);
                ingredient.Description = description;
                ingredient.Color = color;
                ingredient.NutritionPer100 = nutrition;
                ingredient.NutritionSource = nutrition is null ? NutritionDataSource.None : NutritionDataSource.Manual;
                ingredient.Tags = (tagDefinitions ?? [])
                    .Select(tag => new IngredientTagAssignment { IngredientTagDefinitionId = tag.IngredientTagDefinitionId })
                    .ToList();
                pendingChanges.Add(() => context.Ingredients.Add(ingredient));
                result.Target = () => ingredient.IngredientId;
                result.Status = ItemStatus.Create;
                result.Created = ingredient;
                if (ingredient.Tags.Count == 0)
                {
                    result.Warnings.Add("It has no tags, so filters, the shopping list's grouping and the planner's rules cannot see what it is. Send \"tags\".");
                }
                AddSimilarIngredientWarning(result, name, catalog, ingredient);
                continue;
            }

            result.Target = () => existing.IngredientId;
            if (mode == ModeSkip)
            {
                result.Status = ItemStatus.Skip;
                result.Warnings.Add("Already exists and was left unchanged. Send onExistingIngredient: \"update\" to change it.");
                continue;
            }

            result.Status = ItemStatus.Update;
            pendingChanges.Add(() =>
            {
                // Only fields present in the request are touched, so an update can add nutrition without wiping tags.
                if (description is not null)
                {
                    existing.Description = description;
                }

                if (color is not null)
                {
                    existing.Color = color;
                }

                if (nutrition is not null)
                {
                    existing.NutritionPer100 = nutrition;
                    existing.NutritionSource = NutritionDataSource.Manual;
                    existing.NutritionSourceLabel = null;
                    existing.MatvaretabellenFoodId = null;
                    existing.NutritionMatchedName = null;
                    existing.NutritionMatchConfidence = null;
                }

                if (tagDefinitions is not null)
                {
                    var wantedIds = tagDefinitions.Select(tag => tag.IngredientTagDefinitionId).ToHashSet();
                    foreach (var assignment in existing.Tags.Where(tag => !wantedIds.Contains(tag.IngredientTagDefinitionId)).ToList())
                    {
                        existing.Tags.Remove(assignment);
                    }

                    var currentIds = existing.Tags.Select(tag => tag.IngredientTagDefinitionId).ToHashSet();
                    foreach (var tagId in wantedIds.Where(tagId => !currentIds.Contains(tagId)))
                    {
                        existing.Tags.Add(new IngredientTagAssignment { IngredientTagDefinitionId = tagId });
                    }
                }
            });
        }
    }

    private List<RecipePlan> PlanRecipes(
        IReadOnlyCollection<AssistantRecipeInput> inputs,
        string mode,
        bool createMissingIngredients,
        TagIndex tags,
        IngredientCatalog catalog,
        List<Recipe> storedRecipes,
        List<ItemResult> ingredientResults,
        List<ItemResult> recipeResults,
        List<Action> pendingChanges)
    {
        var storedById = storedRecipes.ToDictionary(recipe => recipe.RecipeId);
        var recipesByName = storedRecipes
            .GroupBy(recipe => Key(recipe.Name))
            .ToDictionary(group => group.Key, group => group.OrderBy(recipe => recipe.RecipeId).First());

        // Pass 1: decide what each input does, so components can refer to recipes later in the same request.
        var plans = new List<RecipePlan>();
        var seenNames = new HashSet<string>();
        // Two entries must not both write the same stored recipe (one by id, one by its old name, say).
        var targetedRecipes = new HashSet<Recipe>(ReferenceEqualityComparer.Instance);
        foreach (var input in inputs)
        {
            var name = Clean(input.Name);
            var result = new ItemResult(name.Length == 0 ? "(unnamed recipe)" : name);
            recipeResults.Add(result);

            if (name.Length == 0)
            {
                result.Errors.Add("name is required.");
                continue;
            }

            if (name.Length > ValidationLimits.RecipeNameMaxLength)
            {
                result.Errors.Add($"name is {name.Length} characters; the maximum is {ValidationLimits.RecipeNameMaxLength}. Shorten it and put the detail in description.");
            }

            if (!seenNames.Add(Key(name)))
            {
                result.Errors.Add("This recipe name appears more than once in the request.");
                continue;
            }

            Recipe? existing;
            if (input.Id is not null)
            {
                if (!storedById.TryGetValue(input.Id.Value, out existing))
                {
                    result.Errors.Add($"No recipe has id {input.Id}. Leave id out to match by name or create a new recipe.");
                    continue;
                }

                if (recipesByName.TryGetValue(Key(name), out var sameName) && sameName.RecipeId != existing.RecipeId)
                {
                    result.Errors.Add($"Cannot rename recipe {existing.RecipeId} to \"{name}\": recipe {sameName.RecipeId} already has that name.");
                    continue;
                }
            }
            else
            {
                recipesByName.TryGetValue(Key(name), out existing);
            }

            if (existing is not null && !targetedRecipes.Add(existing))
            {
                result.Errors.Add($"Another entry in this request already changes recipe {existing.RecipeId} (\"{existing.Name}\"). List each recipe once.");
                continue;
            }

            if (existing is not null)
            {
                result.Target = () => existing.RecipeId;
                // An explicit id means "this recipe", so it is always an update.
                if (input.Id is null && mode == ModeSkip)
                {
                    result.Status = ItemStatus.Skip;
                    result.Warnings.Add($"A recipe with this name already exists (id {existing.RecipeId}) and was left unchanged. Send onExistingRecipe: \"update\" to replace it.");
                    continue;
                }

                if (input.Id is null && mode == ModeError)
                {
                    result.Errors.Add($"A recipe with this name already exists (id {existing.RecipeId}).");
                    continue;
                }
            }

            var recipe = existing ?? new Recipe();
            result.Target = () => recipe.RecipeId;
            result.Status = existing is null ? ItemStatus.Create : ItemStatus.Update;
            plans.Add(new RecipePlan(input, name, recipe, existing is null, result));
            // Components elsewhere in this request resolve the name to the planned recipe.
            recipesByName[Key(name)] = recipe;
        }

        // Pass 2: validate content and queue the change.
        foreach (var plan in plans)
        {
            var input = plan.Input;
            var result = plan.Result;

            var description = NullIfEmpty(input.Description?.Trim());
            if (description?.Length > ValidationLimits.DescriptionMaxLength)
            {
                result.Errors.Add($"description is {description.Length} characters; the maximum is {ValidationLimits.DescriptionMaxLength}. Put the steps in instructions instead.");
            }

            // Checked after rounding to the stored two decimals, so 0.001 is not saved as 0.
            if (input.Portions is null || Math.Round(input.Portions.Value, 2) <= 0m)
            {
                result.Errors.Add("portions is required and must be greater than 0: the number of servings the listed amounts make.");
            }

            var tagDefinitions = tags.Resolve(input.Tags ?? [], TagUse.Recipe, result.Errors, result.Warnings, AssistantTagHint);
            var lines = PlanRecipeLines(input, createMissingIngredients, catalog, ingredientResults, result, pendingChanges);
            plan.Components = PlanRecipeComponents(input, plan, recipesByName, storedRecipes, result);
            PlanRecipeImage(input, plan);

            if ((input.Ingredients?.Count ?? 0) == 0 && (input.Components?.Count ?? 0) == 0)
            {
                result.Warnings.Add("The recipe has no ingredients, so it adds nothing to shopping lists or nutrition totals.");
            }

            if (string.IsNullOrWhiteSpace(input.Instructions))
            {
                result.Warnings.Add("The recipe has no instructions.");
            }

            var recipe = plan.Recipe;
            var instructions = NullIfEmpty(input.Instructions?.Trim());
            var portions = Math.Round(input.Portions ?? 1m, 2);
            pendingChanges.Add(() =>
            {
                recipe.Name = plan.Name;
                recipe.Description = description;
                recipe.Instructions = instructions;
                recipe.Portions = portions;
                recipe.ImageUrl = plan.ImageUrl;
                ApplyRecipeLines(recipe, lines);
                ApplyRecipeTags(recipe, tagDefinitions);
                ApplyRecipeComponents(recipe, plan.Components);

                if (plan.IsNew)
                {
                    context.Recipes.Add(recipe);
                }
            });
        }

        ReportComponentCycles(plans, storedRecipes, storedById);
        return plans;
    }

    /// <summary>
    /// imageUrl: absent keeps the photo (a new recipe has none), "" removes it, "/images/..." uses a stored image,
    /// and an http(s) URL is downloaded into image storage. Anything else is an error.
    /// </summary>
    private void PlanRecipeImage(AssistantRecipeInput input, RecipePlan plan)
    {
        var text = input.ImageUrl?.Trim();
        if (text is null)
        {
            plan.ImageUrl = plan.IsNew ? null : plan.Recipe.ImageUrl;
            return;
        }

        if (text.Length == 0)
        {
            plan.ImageUrl = null;
            return;
        }

        if (ImageStorageUrls.ToRelativePath(text) is { } relativePath)
        {
            if (imageStorage.ResolveFile(relativePath) is not { } fullPath || !File.Exists(fullPath))
            {
                plan.Result.Errors.Add($"imageUrl \"{text}\": there is no stored image at that path.");
                return;
            }

            plan.ImageUrl = text;
            if (text != plan.Recipe.ImageUrl)
            {
                plan.Result.ImageUrl = text;
            }

            return;
        }

        if (AssistantImageDownloader.IsDownloadable(text, out var uri))
        {
            plan.ImageDownload = uri;
            return;
        }

        plan.Result.Errors.Add($"imageUrl \"{text}\" must be an http(s) address of a photo, a stored image path (/images/...), or \"\" to remove the photo.");
    }

    private async Task DownloadImagesAsync(List<RecipePlan> plans, CancellationToken cancellationToken)
    {
        var downloads = new Dictionary<Uri, (DownloadedImage? Image, string? Error)>();
        foreach (var plan in plans.Where(plan => plan.ImageDownload is not null && plan.Result.Errors.Count == 0))
        {
            var uri = plan.ImageDownload!;
            if (!downloads.TryGetValue(uri, out var download))
            {
                download = await imageDownloader.DownloadAsync(uri, cancellationToken);
                downloads[uri] = download;
            }

            if (download.Image is null)
            {
                plan.Result.Errors.Add($"imageUrl \"{uri}\" could not be used: {download.Error} Leave imageUrl out to save the recipe without a photo.");
                continue;
            }

            plan.DownloadedImage = download.Image;
        }
    }

    /// <summary>Attaches Matvaretabellen values to each ingredient this request creates without nutrition.</summary>
    private async Task LookUpNutritionAsync(List<ItemResult> ingredientResults, CancellationToken cancellationToken)
    {
        foreach (var result in ingredientResults.Where(result => result.Created is { NutritionPer100: null } && result.Errors.Count == 0))
        {
            var ingredient = result.Created!;
            var lookup = await matvaretabellen.FindMatchesAsync(ingredient.IngredientName, ingredient.Brand?.Name, null, null, cancellationToken);
            var best = lookup.Candidates.OrderByDescending(candidate => candidate.Confidence).FirstOrDefault();
            if (best is null || best.Confidence < NutritionMatchThreshold)
            {
                result.Warnings.Add(best is null
                    ? "lookupNutrition: no Matvaretabellen match (or Matvaretabellen could not be reached); it has no nutrition data. Send nutritionPer100 to set it."
                    : $"lookupNutrition: the closest Matvaretabellen food, \"{best.FoodName}\", matched with confidence {best.Confidence:0.00}, below {NutritionMatchThreshold:0.00}, so nothing was attached. Send nutritionPer100 to set it.");
                continue;
            }

            ingredient.NutritionPer100 = ToNutritionFacts(best.Nutrition);
            ingredient.NutritionSource = NutritionDataSource.Matvaretabellen;
            ingredient.NutritionSourceLabel = "Matvaretabellen";
            ingredient.MatvaretabellenFoodId = best.FoodId;
            ingredient.NutritionMatchedName = best.FoodName;
            ingredient.NutritionMatchConfidence = Math.Round(best.Confidence, 3);
            result.NutritionMatch = new AssistantNutritionMatchDto(best.FoodId, best.FoodName, Math.Round(best.Confidence, 3), best.Url);
        }
    }

    private static NutritionFacts ToNutritionFacts(ProductLookupNutritionDto nutrition) => new()
    {
        Calories = nutrition.Calories is null ? null : (int)Math.Round(nutrition.Calories.Value, MidpointRounding.AwayFromZero),
        CarbohydrateGrams = nutrition.CarbohydrateGrams,
        ProteinGrams = nutrition.ProteinGrams,
        FatGrams = nutrition.FatGrams,
        SaltGrams = nutrition.SaltGrams,
        DietaryFiberGrams = nutrition.DietaryFiberGrams,
        SaturatedFatGrams = nutrition.SaturatedFatGrams,
        TransFatGrams = nutrition.TransFatGrams,
        MonounsaturatedFatGrams = nutrition.MonounsaturatedFatGrams,
        PolyunsaturatedFatGrams = nutrition.PolyunsaturatedFatGrams,
        Omega3Grams = nutrition.Omega3Grams,
        Omega6Grams = nutrition.Omega6Grams,
        CholesterolMilligrams = nutrition.CholesterolMilligrams,
        VitaminAMicrograms = nutrition.VitaminAMicrograms,
        VitaminB9Micrograms = nutrition.VitaminB9Micrograms,
        VitaminB12Micrograms = nutrition.VitaminB12Micrograms,
        VitaminCMilligrams = nutrition.VitaminCMilligrams,
        VitaminDMicrograms = nutrition.VitaminDMicrograms,
        VitaminEMilligrams = nutrition.VitaminEMilligrams,
    };

    private List<RecipeLinePlan> PlanRecipeLines(
        AssistantRecipeInput input,
        bool createMissingIngredients,
        IngredientCatalog catalog,
        List<ItemResult> ingredientResults,
        ItemResult result,
        List<Action> pendingChanges)
    {
        var lines = new List<RecipeLinePlan>();

        foreach (var lineInput in input.Ingredients ?? [])
        {
            var name = Clean(lineInput.Name);
            var brandName = NullIfEmpty(Clean(lineInput.Brand));
            var label = DescribeIngredient(name, brandName);
            if (name.Length == 0)
            {
                result.Errors.Add("An ingredient line is missing its name.");
                continue;
            }

            var lineIsValid = true;
            if (!AssistantUnits.TryParse(lineInput.Unit, out var unit, out var factor))
            {
                result.Errors.Add($"{label}: {AssistantUnits.DescribeUnsupported(lineInput.Unit)}");
                lineIsValid = false;
            }

            if (lineInput.Amount is < 0m)
            {
                result.Errors.Add($"{label}: amount cannot be negative.");
                lineIsValid = false;
            }

            if (!TryParsePreparation(lineInput.Preparation, out var preparation))
            {
                result.Errors.Add($"{label}: {RecipeLineRules.DescribeUnknownPreparation(lineInput.Preparation)}");
                lineIsValid = false;
            }

            var ingredient = catalog.Find(name, brandName, out var findWarning);
            if (findWarning is not null)
            {
                result.Warnings.Add($"{label}: {findWarning}");
            }

            if (ingredient is null)
            {
                var suggestions = catalog.Suggest(name);
                var suggestionText = suggestions.Count == 0 ? string.Empty : $" Similar existing ingredients: {Quote(suggestions)}.";
                if (!createMissingIngredients)
                {
                    result.Errors.Add($"{label}: no such ingredient.{suggestionText} Add it under \"ingredients\" or send createMissingIngredients: true.");
                    continue;
                }

                var nameErrors = new List<string>();
                ValidateIngredientName(name, nameErrors);
                if (nameErrors.Count > 0)
                {
                    result.Errors.AddRange(nameErrors.Select(error => $"{label}: {error}"));
                    continue;
                }

                var created = catalog.Create(name, brandName);
                pendingChanges.Add(() => context.Ingredients.Add(created));
                ingredient = created;

                var ingredientResult = new ItemResult(label)
                {
                    Status = ItemStatus.Create,
                    Target = () => created.IngredientId,
                    Created = created
                };
                ingredientResult.Warnings.Add(
                    $"Created automatically for recipe \"{Clean(input.Name)}\" with no tags. Define it under \"ingredients\" to set tags and nutrition.{suggestionText}");
                ingredientResults.Add(ingredientResult);
            }

            if (!lineIsValid)
            {
                continue;
            }

            var amount = lineInput.Amount is null ? (decimal?)null : lineInput.Amount.Value * factor;
            var duplicate = lines.FirstOrDefault(line => ReferenceEquals(line.Ingredient, ingredient));
            if (duplicate is null)
            {
                lines.Add(new RecipeLinePlan(ingredient)
                {
                    Amount = amount is null ? null : Math.Round(amount.Value, 2),
                    Unit = unit,
                    Preparation = preparation
                });
                continue;
            }

            // The data model holds one line per ingredient, so repeated lines are summed.
            if (AssistantUnits.IsMass(duplicate.Unit) != AssistantUnits.IsMass(unit))
            {
                result.Errors.Add($"{label}: listed more than once with both weight and volume units. Use one line, or the same kind of unit, so the amounts can be added.");
                continue;
            }

            var total = AssistantUnits.ToBase(duplicate.Amount, duplicate.Unit) + AssistantUnits.ToBase(amount, unit);
            duplicate.Amount = duplicate.Amount is null && amount is null ? null : Math.Round(total, 2);
            duplicate.Unit = AssistantUnits.IsMass(unit) ? MeasurementUnit.Gram : MeasurementUnit.Milliliter;
            if (duplicate.Preparation == IngredientPreparation.None)
            {
                duplicate.Preparation = preparation;
            }

            result.Warnings.Add($"{label}: listed more than once; the amounts were added into one line.");
        }

        return lines;
    }

    private static List<RecipeComponentPlan> PlanRecipeComponents(
        AssistantRecipeInput input,
        RecipePlan plan,
        Dictionary<string, Recipe> recipesByName,
        List<Recipe> storedRecipes,
        ItemResult result)
    {
        var components = new List<RecipeComponentPlan>();

        foreach (var componentInput in input.Components ?? [])
        {
            var childName = Clean(componentInput.Recipe);
            if (childName.Length == 0)
            {
                result.Errors.Add("A component is missing \"recipe\" (the name of the recipe it uses).");
                continue;
            }

            var label = $"Component \"{childName}\"";
            if (!recipesByName.TryGetValue(Key(childName), out var child))
            {
                var suggestions = Suggest(childName, storedRecipes.Select(recipe => recipe.Name));
                result.Errors.Add(
                    $"{label}: no such recipe. Include it in the same request or create it first."
                    + (suggestions.Count == 0 ? string.Empty : $" Similar existing recipes: {Quote(suggestions)}."));
                continue;
            }

            if (ReferenceEquals(child, plan.Recipe))
            {
                result.Errors.Add($"{label}: a recipe cannot use itself as a component.");
                continue;
            }

            if (components.Any(component => ReferenceEquals(component.Child, child)))
            {
                result.Errors.Add($"{label}: listed more than once.");
                continue;
            }

            var componentIsValid = true;
            if (!AssistantUnits.TryParse(componentInput.Unit, out var unit, out var factor))
            {
                result.Errors.Add($"{label}: {AssistantUnits.DescribeUnsupported(componentInput.Unit)}");
                componentIsValid = false;
            }

            if (componentInput.Amount is null || Math.Round(componentInput.Amount.Value * factor, 2) <= 0m)
            {
                result.Errors.Add($"{label}: amount is required and must be greater than 0.");
                componentIsValid = false;
            }

            if (!TryParsePreparation(componentInput.Preparation, out var preparation))
            {
                result.Errors.Add($"{label}: {RecipeLineRules.DescribeUnknownPreparation(componentInput.Preparation)}");
                componentIsValid = false;
            }

            if (componentIsValid)
            {
                components.Add(new RecipeComponentPlan(child, Math.Round(componentInput.Amount!.Value * factor, 2), unit, preparation));
            }
        }

        return components;
    }

    private static void ReportComponentCycles(
        List<RecipePlan> plans,
        List<Recipe> storedRecipes,
        Dictionary<int, Recipe> storedById)
    {
        // Graph of "recipe uses recipe" as it would look after the import.
        var plannedRecipes = plans.Select(plan => plan.Recipe).ToHashSet(ReferenceEqualityComparer.Instance);
        var childrenByRecipe = new Dictionary<Recipe, List<Recipe>>(ReferenceEqualityComparer.Instance);
        foreach (var recipe in storedRecipes.Where(recipe => !plannedRecipes.Contains(recipe)))
        {
            childrenByRecipe[recipe] = recipe.Components
                .Select(component => storedById.GetValueOrDefault(component.ChildRecipeId))
                .OfType<Recipe>()
                .ToList();
        }

        foreach (var plan in plans)
        {
            childrenByRecipe[plan.Recipe] = plan.Components.Select(component => component.Child).ToList();
        }

        foreach (var plan in plans.Where(plan => plan.Components.Count > 0))
        {
            var seen = new HashSet<Recipe>(ReferenceEqualityComparer.Instance);
            var stack = new Stack<Recipe>(childrenByRecipe[plan.Recipe]);
            while (stack.Count > 0)
            {
                var current = stack.Pop();
                if (ReferenceEquals(current, plan.Recipe))
                {
                    plan.Result.Errors.Add("Its components lead back to the recipe itself (a circular reference).");
                    break;
                }

                if (!seen.Add(current) || !childrenByRecipe.TryGetValue(current, out var children))
                {
                    continue;
                }

                foreach (var child in children)
                {
                    stack.Push(child);
                }
            }
        }
    }

    private void ApplyRecipeLines(Recipe recipe, List<RecipeLinePlan> lines)
    {
        var wanted = lines.Select(line => line.Ingredient).ToHashSet(ReferenceEqualityComparer.Instance);
        var existingByIngredientId = recipe.Ingredients.ToDictionary(line => line.IngredientId);

        foreach (var stale in recipe.Ingredients
            .Where(line => !lines.Any(wantedLine => wantedLine.Ingredient.IngredientId != 0 && wantedLine.Ingredient.IngredientId == line.IngredientId))
            .ToList())
        {
            recipe.Ingredients.Remove(stale);
            context.RecipeIngredients.Remove(stale);
        }

        foreach (var line in lines)
        {
            if (line.Ingredient.IngredientId != 0 && existingByIngredientId.TryGetValue(line.Ingredient.IngredientId, out var existingLine))
            {
                existingLine.Amount = line.Amount;
                existingLine.Unit = line.Unit;
                existingLine.Preparation = line.Preparation;
                continue;
            }

            recipe.Ingredients.Add(new RecipeIngredient
            {
                Recipe = recipe,
                Ingredient = line.Ingredient,
                Amount = line.Amount,
                Unit = line.Unit,
                Preparation = line.Preparation
            });
        }
    }

    private static void ApplyRecipeTags(Recipe recipe, List<IngredientTagDefinition> tagDefinitions)
    {
        var wantedIds = tagDefinitions.Select(tag => tag.IngredientTagDefinitionId).ToHashSet();
        foreach (var assignment in recipe.Tags.Where(tag => !wantedIds.Contains(tag.IngredientTagDefinitionId)).ToList())
        {
            recipe.Tags.Remove(assignment);
        }

        var currentIds = recipe.Tags.Select(tag => tag.IngredientTagDefinitionId).ToHashSet();
        foreach (var tagId in wantedIds.Where(tagId => !currentIds.Contains(tagId)))
        {
            recipe.Tags.Add(new RecipeTagAssignment { IngredientTagDefinitionId = tagId });
        }
    }

    private static void ApplyRecipeComponents(Recipe recipe, List<RecipeComponentPlan> components)
    {
        foreach (var stale in recipe.Components
            .Where(component => !components.Any(wanted => wanted.Child.RecipeId != 0 && wanted.Child.RecipeId == component.ChildRecipeId))
            .ToList())
        {
            recipe.Components.Remove(stale);
        }

        var existingByChildId = recipe.Components.ToDictionary(component => component.ChildRecipeId);
        for (var index = 0; index < components.Count; index++)
        {
            var wanted = components[index];
            if (wanted.Child.RecipeId != 0 && existingByChildId.TryGetValue(wanted.Child.RecipeId, out var existingComponent))
            {
                existingComponent.Amount = wanted.Amount;
                existingComponent.Unit = wanted.Unit;
                existingComponent.Preparation = wanted.Preparation;
                existingComponent.SortOrder = index + 1;
                continue;
            }

            recipe.Components.Add(new RecipeComponent
            {
                ParentRecipe = recipe,
                ChildRecipe = wanted.Child,
                Amount = wanted.Amount,
                Unit = wanted.Unit,
                Preparation = wanted.Preparation,
                SortOrder = index + 1
            });
        }
    }

    // ---------- Meal plan ----------

    /// <summary>The range a read covers: the current week by default, or seven days from or up to the one date given.</summary>
    public static (DateOnly From, DateOnly To) ResolveReadRange(DateOnly? from, DateOnly? to)
    {
        var start = from ?? (to is null ? StartOfWeek(DateOnly.FromDateTime(DateTime.Now)) : to.Value.AddDays(-6));
        return (start, to ?? start.AddDays(6));
    }

    public static bool IsReadRangeTooLong(DateOnly from, DateOnly to) => to.DayNumber - from.DayNumber >= MaxReadRangeDays;

    public async Task<AssistantMealPlanDto> GetMealPlanAsync(DateOnly? from, DateOnly? to, CancellationToken cancellationToken)
    {
        var (start, end) = ResolveReadRange(from, to);

        var entries = await context.MealPlanEntries
            .AsNoTracking()
            .AsSplitQuery()
            .Include(entry => entry.Recipes)
                .ThenInclude(item => item.Recipe)
            .Include(entry => entry.Recipes)
                .ThenInclude(item => item.Ingredient)
            .Where(entry => entry.Date >= start && entry.Date <= end)
            .ToListAsync(cancellationToken);

        return new AssistantMealPlanDto(
            start,
            end,
            entries
                .OrderBy(entry => entry.Date)
                .ThenBy(entry => entry.Slot)
                .Select(entry => new AssistantMealPlanEntryDto(
                    entry.Date,
                    entry.Date.DayOfWeek.ToString(),
                    entry.Slot.ToString(),
                    entry.Notes,
                    entry.Recipes
                        .OrderBy(item => item.SortOrder)
                        .Select(item => new AssistantMealPlanItemDto(
                            item.Role.ToString(),
                            item.Recipe?.Name,
                            item.RecipeId,
                            item.Portions,
                            item.Ingredient?.IngredientName,
                            item.Amount,
                            item.Unit is null ? null : AssistantUnits.ToShort(item.Unit.Value)))
                        .ToList()))
                .ToList());
    }

    public async Task<AssistantMealPlanResultDto> SetMealPlanAsync(AssistantMealPlanRequest request, CancellationToken cancellationToken)
    {
        var dryRun = request.DryRun ?? false;
        var requestErrors = new List<string>();
        var mode = ParseOption(request.Mode, ModeReplace, [ModeReplace, ModeFill], "mode", requestErrors);
        var entryInputs = request.Entries ?? [];

        if (entryInputs.Count == 0 && request.ClearRange is null)
        {
            requestErrors.Add("Nothing to do: provide \"entries\" and/or \"clearRange\".");
        }

        (DateOnly From, DateOnly To)? clearRange = null;
        if (request.ClearRange is { } range)
        {
            if (range.From is null || range.To is null)
            {
                requestErrors.Add("clearRange needs both \"from\" and \"to\" (YYYY-MM-DD).");
            }
            else if (range.From > range.To)
            {
                requestErrors.Add("clearRange.from must be on or before clearRange.to.");
            }
            else if (range.To.Value.DayNumber - range.From.Value.DayNumber >= MaxRangeDays)
            {
                requestErrors.Add($"clearRange can span at most {MaxRangeDays} days.");
            }
            else
            {
                clearRange = (range.From.Value, range.To.Value);
            }
        }

        var datedInputs = entryInputs.Where(entry => entry.Date is not null).ToList();

        var recipes = await context.Recipes
            .AsNoTracking()
            .Select(recipe => new RecipeReference(recipe.RecipeId, recipe.Name, recipe.Portions))
            .ToListAsync(cancellationToken);
        var recipesById = recipes.ToDictionary(recipe => recipe.Id);
        var recipesByName = recipes
            .GroupBy(recipe => Key(recipe.Name))
            .ToDictionary(group => group.Key, group => group.OrderBy(recipe => recipe.Id).First());
        var catalog = new IngredientCatalog(
            await context.Ingredients.AsNoTracking().Include(ingredient => ingredient.Brand).ToListAsync(cancellationToken),
            []);

        var dates = datedInputs.Select(entry => entry.Date!.Value).ToList();
        if (clearRange is not null)
        {
            dates.Add(clearRange.Value.From);
            dates.Add(clearRange.Value.To);
        }

        var storedEntries = new List<MealPlanEntry>();
        if (dates.Count > 0)
        {
            var firstDate = dates.Min();
            var lastDate = dates.Max();
            storedEntries = await mealPlanWriter.LoadRangeAsync(firstDate, lastDate, cancellationToken);
        }

        var storedBySlot = storedEntries.ToDictionary(entry => (entry.Date, entry.Slot));

        var results = new List<EntryResult>();
        var pendingChanges = new List<Action>();
        var requestedSlots = new HashSet<(DateOnly, MealSlot)>();
        // Each slot this write changes, as it is now and as it will be, so the write can be undone.
        var touchedSlots = new List<MealPlanUndoSlot>();

        foreach (var entryInput in entryInputs)
        {
            var result = new EntryResult(entryInput.Date, Clean(entryInput.Slot));
            results.Add(result);

            if (entryInput.Date is not { } date)
            {
                result.Errors.Add("date is required (YYYY-MM-DD).");
                continue;
            }

            if (!TryParseName<MealSlot>(entryInput.Slot, out var slot))
            {
                result.Errors.Add($"slot \"{entryInput.Slot}\" is not valid. Use one of: {string.Join(", ", Enum.GetNames<MealSlot>())}.");
                continue;
            }

            result.Slot = slot.ToString();
            if (!requestedSlots.Add((date, slot)))
            {
                result.Errors.Add("This date and slot appears more than once in the request. Put all items for a meal in one entry.");
                continue;
            }

            var notes = NullIfEmpty(entryInput.Notes?.Trim());
            if (notes?.Length > ValidationLimits.MealNotesMaxLength)
            {
                result.Errors.Add($"notes is {notes.Length} characters; the maximum is {ValidationLimits.MealNotesMaxLength}.");
            }

            var items = PlanMealItems(entryInput.Items ?? [], recipesById, recipesByName, catalog, result);
            storedBySlot.TryGetValue((date, slot), out var stored);

            if (stored is not null && stored.Recipes.Count > 0 && mode == ModeFill)
            {
                result.Status = EntryStatus.Skip;
                result.Warnings.Add("This slot is already planned and mode is \"fill\", so it was left unchanged.");
                continue;
            }

            if (items.Count == 0 && result.Errors.Count == 0)
            {
                // An entry with no items means "this meal should be empty".
                result.Status = stored is null ? EntryStatus.Unchanged : EntryStatus.Clear;
                if (stored is not null)
                {
                    touchedSlots.Add(new MealPlanUndoSlot(date, slot, MealSlotSnapshot.From(stored), null));
                    pendingChanges.Add(() => mealPlanWriter.Remove(stored));
                }

                continue;
            }

            result.Status = stored is null ? EntryStatus.Create : EntryStatus.Replace;
            touchedSlots.Add(new MealPlanUndoSlot(date, slot, MealSlotSnapshot.From(stored), MealSlotSnapshot.From(notes, items)));
            pendingChanges.Add(() => mealPlanWriter.Upsert(stored, date, slot, notes, items));
        }

        if (clearRange is not null && requestErrors.Count == 0)
        {
            foreach (var stored in storedEntries
                .Where(entry => entry.Date >= clearRange.Value.From && entry.Date <= clearRange.Value.To)
                .Where(entry => !requestedSlots.Contains((entry.Date, entry.Slot)))
                .OrderBy(entry => entry.Date)
                .ThenBy(entry => entry.Slot))
            {
                results.Add(new EntryResult(stored.Date, stored.Slot.ToString()) { Status = EntryStatus.Clear });
                touchedSlots.Add(new MealPlanUndoSlot(stored.Date, stored.Slot, MealSlotSnapshot.From(stored), null));
                pendingChanges.Add(() => mealPlanWriter.Remove(stored));
            }
        }

        var hasErrors = requestErrors.Count > 0 || results.Any(result => result.Errors.Count > 0);
        var applied = !dryRun && !hasErrors;
        if (applied)
        {
            foreach (var change in pendingChanges)
            {
                change();
            }

            writeLog.Add(
                AssistantWriteLogService.MealPlanEndpoint,
                DescribeMealPlanWrite(results, touchedSlots),
                new Dictionary<string, int>
                {
                    ["slotsCreated"] = results.Count(result => result.Status == EntryStatus.Create),
                    ["slotsReplaced"] = results.Count(result => result.Status == EntryStatus.Replace),
                    ["slotsCleared"] = results.Count(result => result.Status == EntryStatus.Clear),
                    ["slotsSkipped"] = results.Count(result => result.Status == EntryStatus.Skip),
                },
                new MealPlanUndoState(touchedSlots));
            await context.SaveChangesAsync(cancellationToken);
            await writeLog.PruneAsync(cancellationToken);
        }

        return new AssistantMealPlanResultDto(
            dryRun,
            applied,
            requestErrors,
            results
                .OrderBy(result => result.Date)
                .ThenBy(result => Enum.TryParse<MealSlot>(result.Slot, out var slot) ? (int)slot : int.MaxValue)
                .Select(result => result.ToDto(applied))
                .ToList());
    }

    private static List<MealPlanRecipe> PlanMealItems(
        IReadOnlyCollection<AssistantMealPlanItemInput> itemInputs,
        Dictionary<int, RecipeReference> recipesById,
        Dictionary<string, RecipeReference> recipesByName,
        IngredientCatalog catalog,
        EntryResult result)
    {
        var items = new List<MealPlanRecipe>();

        foreach (var itemInput in itemInputs)
        {
            var recipeName = Clean(itemInput.Recipe);
            var ingredientName = Clean(itemInput.Ingredient);
            var wantsRecipe = recipeName.Length > 0 || itemInput.RecipeId is not null;
            var wantsIngredient = ingredientName.Length > 0;
            if (wantsRecipe == wantsIngredient)
            {
                result.Errors.Add("Each item needs exactly one of \"recipe\" (or \"recipeId\") and \"ingredient\".");
                continue;
            }

            MealRecipeRole role;
            if (string.IsNullOrWhiteSpace(itemInput.Role))
            {
                // Mirrors the planner UI: the first item is the meal, the rest accompany it.
                role = items.Count == 0 ? MealRecipeRole.Main : MealRecipeRole.Side;
            }
            else if (!TryParseName(itemInput.Role, out role))
            {
                result.Errors.Add($"role \"{itemInput.Role}\" is not valid. Use one of: {string.Join(", ", Enum.GetNames<MealRecipeRole>())}.");
                continue;
            }

            if (wantsRecipe)
            {
                RecipeReference? recipe;
                if (itemInput.RecipeId is not null)
                {
                    recipesById.TryGetValue(itemInput.RecipeId.Value, out recipe);
                }
                else
                {
                    recipesByName.TryGetValue(Key(recipeName), out recipe);
                }

                if (recipe is null)
                {
                    var wanted = itemInput.RecipeId is not null ? $"id {itemInput.RecipeId}" : $"\"{recipeName}\"";
                    var suggestions = recipeName.Length == 0 ? [] : Suggest(recipeName, recipesByName.Values.Select(value => value.Name));
                    result.Errors.Add(
                        $"Recipe {wanted} does not exist."
                        + (suggestions.Count == 0 ? " Create it with POST /api/assistant/recipes first." : $" Did you mean {Quote(suggestions)}?"));
                    continue;
                }

                if (itemInput.Portions is not null && Math.Round(itemInput.Portions.Value, 2) <= 0m)
                {
                    result.Errors.Add($"\"{recipe.Name}\": portions must be greater than 0.");
                    continue;
                }

                if (itemInput.Amount is not null || !string.IsNullOrWhiteSpace(itemInput.Unit))
                {
                    result.Warnings.Add($"\"{recipe.Name}\": amount and unit only apply to ingredient items and were ignored. Use portions for recipes.");
                }

                var portions = Math.Round(itemInput.Portions ?? recipe.Portions, 2);
                items.Add(new MealPlanRecipe
                {
                    RecipeId = recipe.Id,
                    Role = role,
                    SortOrder = items.Count,
                    Portions = portions
                });
                result.Items.Add($"{recipe.Name} × {portions.ToString("0.##", CultureInfo.InvariantCulture)}");
                continue;
            }

            var brandName = NullIfEmpty(Clean(itemInput.Brand));
            var label = DescribeIngredient(ingredientName, brandName);
            var ingredient = catalog.Find(ingredientName, brandName, out var findWarning);
            if (findWarning is not null)
            {
                result.Warnings.Add($"{label}: {findWarning}");
            }

            if (ingredient is null)
            {
                var suggestions = catalog.Suggest(ingredientName);
                result.Errors.Add(
                    $"Ingredient {label} does not exist."
                    + (suggestions.Count == 0 ? " Create it with POST /api/assistant/recipes first." : $" Did you mean {Quote(suggestions)}?"));
                continue;
            }

            if (!AssistantUnits.TryParse(itemInput.Unit, out var unit, out var factor))
            {
                result.Errors.Add($"{label}: {AssistantUnits.DescribeUnsupported(itemInput.Unit)}");
                continue;
            }

            if (itemInput.Amount is null || Math.Round(itemInput.Amount.Value * factor, 2) <= 0m)
            {
                result.Errors.Add($"{label}: amount is required for ingredient items and must be greater than 0.");
                continue;
            }

            if (itemInput.Portions is not null)
            {
                result.Warnings.Add($"{label}: portions only applies to recipe items and was ignored. Use amount and unit for ingredients.");
            }

            var amount = Math.Round(itemInput.Amount.Value * factor, 2);
            items.Add(new MealPlanRecipe
            {
                IngredientId = ingredient.IngredientId,
                Role = role,
                SortOrder = items.Count,
                Amount = amount,
                Unit = unit
            });
            result.Items.Add($"{ingredient.IngredientName} {amount.ToString("0.##", CultureInfo.InvariantCulture)} {AssistantUnits.ToShort(unit)}");
        }

        return items;
    }

    // ---------- Shared helpers ----------

    private static string DescribeImport(List<ItemResult> ingredientResults, List<ItemResult> recipeResults)
    {
        var parts = new List<string>();
        AddPart("Created recipes", recipeResults, ItemStatus.Create);
        AddPart("updated recipes", recipeResults, ItemStatus.Update);
        AddPart("created ingredients", ingredientResults, ItemStatus.Create);
        AddPart("updated ingredients", ingredientResults, ItemStatus.Update);
        if (parts.Count == 0)
        {
            return "No changes; everything already existed.";
        }

        var text = string.Join("; ", parts) + ".";
        return char.ToUpperInvariant(text[0]) + text[1..];

        void AddPart(string label, List<ItemResult> results, ItemStatus status)
        {
            var names = results.Where(result => result.Status == status).Select(result => result.Name).ToList();
            if (names.Count > 0)
            {
                parts.Add($"{label} {string.Join(", ", names.Take(5))}{(names.Count > 5 ? $" and {names.Count - 5} more" : "")}");
            }
        }
    }

    private static string DescribeMealPlanWrite(List<EntryResult> results, List<MealPlanUndoSlot> touchedSlots)
    {
        var counts = new List<string>();
        void AddCount(int count, string label)
        {
            if (count > 0)
            {
                counts.Add($"{count} {label}");
            }
        }

        AddCount(results.Count(result => result.Status == EntryStatus.Create), "created");
        AddCount(results.Count(result => result.Status == EntryStatus.Replace), "replaced");
        AddCount(results.Count(result => result.Status == EntryStatus.Clear), "cleared");
        AddCount(results.Count(result => result.Status == EntryStatus.Skip), "skipped");
        if (touchedSlots.Count == 0)
        {
            return $"Meal plan unchanged ({(counts.Count == 0 ? "nothing to do" : string.Join(", ", counts))}).";
        }

        var first = touchedSlots.Min(slot => slot.Date);
        var last = touchedSlots.Max(slot => slot.Date);
        var range = first == last ? $"{first:yyyy-MM-dd}" : $"{first:yyyy-MM-dd} to {last:yyyy-MM-dd}";
        return $"Meal plan {range}: {string.Join(", ", counts)}.";
    }

    private static DateOnly StartOfWeek(DateOnly date) =>
        date.AddDays(-(((int)date.DayOfWeek + 6) % 7));

    private static string ParseOption(string? value, string fallback, string[] allowed, string name, List<string> errors)
    {
        var cleaned = Clean(value).ToLowerInvariant();
        if (cleaned.Length == 0)
        {
            return fallback;
        }

        if (allowed.Contains(cleaned))
        {
            return cleaned;
        }

        errors.Add($"{name} \"{value}\" is not valid. Use one of: {string.Join(", ", allowed)}.");
        return fallback;
    }

    private static void ValidateIngredientName(string name, List<string> errors)
    {
        if (name.Length == 0)
        {
            errors.Add("name is required.");
        }
        else if (name.Length > ValidationLimits.IngredientNameMaxLength)
        {
            errors.Add($"name is {name.Length} characters; the maximum is {ValidationLimits.IngredientNameMaxLength}.");
        }
    }

    private static void AddSimilarIngredientWarning(ItemResult result, string name, IngredientCatalog catalog, Ingredient created)
    {
        var suggestions = catalog.Suggest(name, except: created);
        if (suggestions.Count > 0)
        {
            result.Warnings.Add($"Similar ingredients already exist: {Quote(suggestions)}. Reuse one of them if this is the same thing.");
        }
    }

    private static NutritionFacts? ToNutritionFacts(AssistantNutritionInput? input, List<string> errors)
    {
        if (input is null)
        {
            return null;
        }

        var values = new (string Name, decimal? Value)[]
        {
            ("calories", input.Calories), ("carbohydrateGrams", input.CarbohydrateGrams), ("proteinGrams", input.ProteinGrams),
            ("fatGrams", input.FatGrams), ("saltGrams", input.SaltGrams), ("dietaryFiberGrams", input.DietaryFiberGrams),
            ("saturatedFatGrams", input.SaturatedFatGrams), ("transFatGrams", input.TransFatGrams),
            ("monounsaturatedFatGrams", input.MonounsaturatedFatGrams), ("polyunsaturatedFatGrams", input.PolyunsaturatedFatGrams),
            ("omega3Grams", input.Omega3Grams), ("omega6Grams", input.Omega6Grams), ("cholesterolMilligrams", input.CholesterolMilligrams),
            ("vitaminAMicrograms", input.VitaminAMicrograms), ("vitaminB9Micrograms", input.VitaminB9Micrograms),
            ("vitaminB12Micrograms", input.VitaminB12Micrograms), ("vitaminCMilligrams", input.VitaminCMilligrams),
            ("vitaminDMicrograms", input.VitaminDMicrograms), ("vitaminEMilligrams", input.VitaminEMilligrams),
        };
        var invalid = values.Where(value => value.Value is < 0m or > MaxNutrientValue).Select(value => value.Name).ToList();
        if (invalid.Count > 0)
        {
            errors.Add($"nutritionPer100: {string.Join(", ", invalid)} must be between 0 and {MaxNutrientValue} (values are per 100 g or 100 ml).");
            return null;
        }

        return new NutritionFacts
        {
            Calories = input.Calories is null ? null : (int)Math.Round(input.Calories.Value, MidpointRounding.AwayFromZero),
            CarbohydrateGrams = Round(input.CarbohydrateGrams),
            ProteinGrams = Round(input.ProteinGrams),
            FatGrams = Round(input.FatGrams),
            SaltGrams = Round(input.SaltGrams),
            DietaryFiberGrams = Round(input.DietaryFiberGrams),
            SaturatedFatGrams = Round(input.SaturatedFatGrams),
            TransFatGrams = Round(input.TransFatGrams),
            MonounsaturatedFatGrams = Round(input.MonounsaturatedFatGrams),
            PolyunsaturatedFatGrams = Round(input.PolyunsaturatedFatGrams),
            Omega3Grams = Round(input.Omega3Grams),
            Omega6Grams = Round(input.Omega6Grams),
            CholesterolMilligrams = Round(input.CholesterolMilligrams),
            VitaminAMicrograms = Round(input.VitaminAMicrograms),
            VitaminB9Micrograms = Round(input.VitaminB9Micrograms),
            VitaminB12Micrograms = Round(input.VitaminB12Micrograms),
            VitaminCMilligrams = Round(input.VitaminCMilligrams),
            VitaminDMicrograms = Round(input.VitaminDMicrograms),
            VitaminEMilligrams = Round(input.VitaminEMilligrams),
        };

        // The columns hold two decimals.
        static decimal? Round(decimal? value) => value is null ? null : Math.Round(value.Value, 2);
    }

    /// <summary>Parses an enum name, ignoring case. Unlike Enum.TryParse it does not accept numbers such as "2".</summary>
    private static bool TryParseName<TEnum>(string? value, out TEnum result) where TEnum : struct, Enum
    {
        var cleaned = Clean(value);
        result = default;
        return cleaned.Length > 0
            && !int.TryParse(cleaned, out _)
            && Enum.TryParse(cleaned, ignoreCase: true, out result)
            && Enum.IsDefined(result);
    }

    private static bool TryParsePreparation(string? value, out IngredientPreparation preparation)
    {
        preparation = IngredientPreparation.None;
        var cleaned = new string(Clean(value).Where(char.IsLetter).ToArray());
        return cleaned.Length == 0
            || (Enum.TryParse(cleaned, ignoreCase: true, out preparation) && Enum.IsDefined(preparation));
    }

    private static bool IsHexColor(string value) =>
        value.Length is 4 or 7 && value[0] == '#' && value.Skip(1).All(Uri.IsHexDigit);

    private static string DescribeIngredient(string name, string? brandName)
    {
        var displayName = name.Length == 0 ? "(unnamed ingredient)" : name;
        return brandName is null ? displayName : $"{displayName} ({brandName})";
    }

    internal static string Key(string? value) => Clean(value).ToLowerInvariant();

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;

    private enum ItemStatus
    {
        Error,
        Create,
        Update,
        Skip
    }

    private enum EntryStatus
    {
        Error,
        Create,
        Replace,
        Clear,
        Skip,
        Unchanged
    }

    private sealed class ItemResult(string name)
    {
        public string Name { get; } = name;
        public ItemStatus Status { get; set; } = ItemStatus.Error;
        public Func<int>? Target { get; set; }
        public List<string> Warnings { get; } = [];
        public List<string> Errors { get; } = [];
        /// <summary>The new ingredient this result creates, when it is an ingredient being created.</summary>
        public Ingredient? Created { get; set; }
        public AssistantNutritionMatchDto? NutritionMatch { get; set; }
        public string? ImageUrl { get; set; }

        public AssistantItemResultDto ToDto(bool applied)
        {
            var status = Errors.Count > 0
                ? "error"
                : Status switch
                {
                    ItemStatus.Create => applied ? "created" : "would_create",
                    ItemStatus.Update => applied ? "updated" : "would_update",
                    ItemStatus.Skip => "skipped",
                    _ => "error"
                };
            var id = Target?.Invoke();
            return new AssistantItemResultDto(Name, status, id is null or 0 ? null : id, Warnings, Errors, ImageUrl, NutritionMatch);
        }
    }

    private sealed class EntryResult(DateOnly? date, string slot)
    {
        public DateOnly? Date { get; } = date;
        public string Slot { get; set; } = slot;
        public EntryStatus Status { get; set; } = EntryStatus.Error;
        public List<string> Items { get; } = [];
        public List<string> Warnings { get; } = [];
        public List<string> Errors { get; } = [];

        public AssistantMealPlanEntryResultDto ToDto(bool applied)
        {
            var status = Errors.Count > 0
                ? "error"
                : Status switch
                {
                    EntryStatus.Create => applied ? "created" : "would_create",
                    EntryStatus.Replace => applied ? "replaced" : "would_replace",
                    EntryStatus.Clear => applied ? "cleared" : "would_clear",
                    EntryStatus.Skip => "skipped",
                    EntryStatus.Unchanged => "unchanged",
                    _ => "error"
                };
            return new AssistantMealPlanEntryResultDto(Date, Slot, status, Items, Warnings, Errors);
        }
    }

    private sealed class RecipePlan(AssistantRecipeInput input, string name, Recipe recipe, bool isNew, ItemResult result)
    {
        public AssistantRecipeInput Input { get; } = input;
        public string Name { get; } = name;
        public Recipe Recipe { get; } = recipe;
        public bool IsNew { get; } = isNew;
        public ItemResult Result { get; } = result;
        public List<RecipeComponentPlan> Components { get; set; } = [];
        /// <summary>The photo the recipe ends up with; set from the download once it has been stored.</summary>
        public string? ImageUrl { get; set; }
        public Uri? ImageDownload { get; set; }
        public DownloadedImage? DownloadedImage { get; set; }
    }

    private sealed class RecipeLinePlan(Ingredient ingredient)
    {
        public Ingredient Ingredient { get; } = ingredient;
        public decimal? Amount { get; set; }
        public MeasurementUnit Unit { get; set; }
        public IngredientPreparation Preparation { get; set; }
    }

    private sealed record RecipeComponentPlan(Recipe Child, decimal Amount, MeasurementUnit Unit, IngredientPreparation Preparation);

    private sealed record RecipeReference(int Id, string Name, decimal Portions);

    /// <summary>
    /// The ingredients known so far, including ones an import has decided to create but not yet saved.
    /// </summary>
    private sealed class IngredientCatalog(List<Ingredient> ingredients, List<Brand> brands)
    {
        private readonly List<Ingredient> ingredients = ingredients;
        private readonly List<Brand> brands = brands;

        public Ingredient? FindExact(string name, string? brandName) =>
            Named(name).FirstOrDefault(ingredient => Key(ingredient.Brand?.Name) == Key(brandName));

        public Ingredient? Find(string name, string? brandName, out string? warning)
        {
            warning = null;
            if (brandName is not null)
            {
                return FindExact(name, brandName);
            }

            var candidates = Named(name).ToList();
            var unbranded = candidates.FirstOrDefault(ingredient => ingredient.Brand is null);
            if (unbranded is not null || candidates.Count == 0)
            {
                return unbranded;
            }

            if (candidates.Count > 1)
            {
                warning = $"several brands exist ({string.Join(", ", candidates.Select(ingredient => ingredient.Brand!.Name))}); "
                    + $"used {candidates[0].Brand!.Name}. Set \"brand\" to choose another.";
            }

            return candidates[0];
        }

        public Ingredient Create(string name, string? brandName)
        {
            var ingredient = new Ingredient { IngredientName = name };
            if (brandName is not null)
            {
                var brand = brands.FirstOrDefault(value => Key(value.Name) == Key(brandName));
                if (brand is null)
                {
                    brand = new Brand { Name = brandName };
                    brands.Add(brand);
                }

                ingredient.Brand = brand;
            }

            ingredients.Add(ingredient);
            return ingredient;
        }

        public List<string> Suggest(string name, Ingredient? except = null) =>
            CatalogNames.Suggest(
                name,
                ingredients.Where(ingredient => !ReferenceEquals(ingredient, except)).Select(ingredient => ingredient.IngredientName));

        private IEnumerable<Ingredient> Named(string name) =>
            ingredients.Where(ingredient => Key(ingredient.IngredientName) == Key(name));
    }
}

/// <summary>
/// Unit parsing for the assistant API. MATFLOTE stores grams, kilograms, millilitres and litres;
/// other exact metric and spoon measures are converted on the way in.
/// </summary>
internal static class AssistantUnits
{
    private static readonly Dictionary<string, (MeasurementUnit Unit, decimal Factor)> Known = new(StringComparer.OrdinalIgnoreCase)
    {
        ["g"] = (MeasurementUnit.Gram, 1m),
        ["gram"] = (MeasurementUnit.Gram, 1m),
        ["grams"] = (MeasurementUnit.Gram, 1m),
        ["kg"] = (MeasurementUnit.Kilogram, 1m),
        ["kilogram"] = (MeasurementUnit.Kilogram, 1m),
        ["kilograms"] = (MeasurementUnit.Kilogram, 1m),
        ["ml"] = (MeasurementUnit.Milliliter, 1m),
        ["milliliter"] = (MeasurementUnit.Milliliter, 1m),
        ["milliliters"] = (MeasurementUnit.Milliliter, 1m),
        ["millilitre"] = (MeasurementUnit.Milliliter, 1m),
        ["millilitres"] = (MeasurementUnit.Milliliter, 1m),
        ["l"] = (MeasurementUnit.Liter, 1m),
        ["liter"] = (MeasurementUnit.Liter, 1m),
        ["liters"] = (MeasurementUnit.Liter, 1m),
        ["litre"] = (MeasurementUnit.Liter, 1m),
        ["litres"] = (MeasurementUnit.Liter, 1m),
        ["cl"] = (MeasurementUnit.Milliliter, 10m),
        ["dl"] = (MeasurementUnit.Milliliter, 100m),
        ["tsp"] = (MeasurementUnit.Milliliter, 5m),
        ["ts"] = (MeasurementUnit.Milliliter, 5m),
        ["teaspoon"] = (MeasurementUnit.Milliliter, 5m),
        ["teaspoons"] = (MeasurementUnit.Milliliter, 5m),
        ["tbsp"] = (MeasurementUnit.Milliliter, 15m),
        ["ss"] = (MeasurementUnit.Milliliter, 15m),
        ["tablespoon"] = (MeasurementUnit.Milliliter, 15m),
        ["tablespoons"] = (MeasurementUnit.Milliliter, 15m)
    };

    public static IReadOnlyCollection<string> CanonicalUnits { get; } = ["g", "kg", "ml", "l"];

    public static IReadOnlyDictionary<string, string> AliasDescriptions { get; } = new Dictionary<string, string>
    {
        ["cl"] = "10 ml",
        ["dl"] = "100 ml",
        ["tsp / ts"] = "5 ml",
        ["tbsp / ss"] = "15 ml"
    };

    public static bool TryParse(string? text, out MeasurementUnit unit, out decimal factor)
    {
        var cleaned = Clean(text).TrimEnd('.');
        if (cleaned.Length == 0)
        {
            unit = MeasurementUnit.Gram;
            factor = 1m;
            return true;
        }

        if (Known.TryGetValue(cleaned, out var match))
        {
            (unit, factor) = match;
            return true;
        }

        unit = MeasurementUnit.Gram;
        factor = 1m;
        return false;
    }

    public static string DescribeUnsupported(string? text) =>
        $"unit \"{text}\" is not supported. Use g, kg, ml or l (cl, dl, tsp/ts and tbsp/ss are converted to ml). "
        + "Convert pieces, cloves, cans and similar to grams; conversionRules in GET /api/assistant/context lists the household's own conversions.";

    public static string ToShort(MeasurementUnit unit) => unit switch
    {
        MeasurementUnit.Gram => "g",
        MeasurementUnit.Kilogram => "kg",
        MeasurementUnit.Milliliter => "ml",
        MeasurementUnit.Liter => "l",
        _ => unit.ToString()
    };

    public static bool IsMass(MeasurementUnit unit) => unit is MeasurementUnit.Gram or MeasurementUnit.Kilogram;

    public static decimal ToBase(decimal? amount, MeasurementUnit unit) =>
        (amount ?? 0m) * (unit is MeasurementUnit.Kilogram or MeasurementUnit.Liter ? 1000m : 1m);
}
