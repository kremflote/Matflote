// MATFLOTE: Builds downloadable recipe PDFs from database recipes, local image storage, and calculated nutrition summaries.
// Note: The PDF is generated inside MATFLOTE with QuestPDF; no external PDF service is called, and nutrition remains intentionally approximate.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;
using System.Text.RegularExpressions;

namespace DinnerPlanner.Api.Services;

public sealed class RecipePdfService(
    DinnerPlannerContext context,
    ImageStoragePathProvider imageStorage,
    ILogger<RecipePdfService> logger)
{
    private const string GitHubUrl = "https://github.com/kremflote/Matflote";
    private const string BrandName = "MATFLOTE";
    private static readonly CultureInfo NumberCulture = CultureInfo.InvariantCulture;

    public async Task<RecipePdfResult?> CreateRecipePdfAsync(
        int recipeId,
        string? language,
        CancellationToken cancellationToken)
    {
        var recipes = await LoadRecipesAsync(cancellationToken);
        var recipe = recipes.FirstOrDefault(currentRecipe => currentRecipe.RecipeId == recipeId);
        if (recipe is null)
        {
            return null;
        }

        var labels = PdfLabels.For(language);
        var ingredientSections = BuildIngredientSections(recipe, recipes, labels);
        var totalNutrition = CalculateNutrition(recipe, recipes, new HashSet<int>(), 1m);
        var totalBaseAmount = CalculateBaseAmount(recipe, recipes, new HashSet<int>(), 1m);
        var imageBytes = TryGetImageBytes(recipe.ImageUrl);
        var exportedAt = DateTimeOffset.UtcNow;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.PageColor("#F4F5F2");
                page.DefaultTextStyle(text => text.FontSize(10).FontColor("#24342C"));

                page.Header().Element(header => ComposeHeader(header, recipe, labels));
                page.Content().PaddingTop(12).Element(content =>
                    ComposeContent(content, recipe, labels, imageBytes, ingredientSections, totalNutrition, totalBaseAmount));
                page.Footer().Element(footer => ComposeFooter(footer, labels, exportedAt));
            });
        });

        return new RecipePdfResult(
            document.GeneratePdf(),
            $"{ToSafeFileName(recipe.Name)}.pdf");
    }

    private async Task<List<Recipe>> LoadRecipesAsync(CancellationToken cancellationToken) =>
        await context.Recipes
            .AsNoTracking()
            .Include(recipe => recipe.Ingredients)
                .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                    .ThenInclude(ingredient => ingredient.Brand)
            .Include(recipe => recipe.Ingredients)
                .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                    .ThenInclude(ingredient => ingredient.Tags)
                        .ThenInclude(tag => tag.TagDefinition)
            .Include(recipe => recipe.Tags)
                .ThenInclude(tag => tag.TagDefinition)
            .Include(recipe => recipe.Components)
                .ThenInclude(component => component.ChildRecipe)
                    .ThenInclude(childRecipe => childRecipe.Ingredients)
                        .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                            .ThenInclude(ingredient => ingredient.Brand)
            .Include(recipe => recipe.Components)
                .ThenInclude(component => component.ChildRecipe)
                    .ThenInclude(childRecipe => childRecipe.Tags)
                        .ThenInclude(tag => tag.TagDefinition)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync(cancellationToken);

    private static void ComposeHeader(IContainer container, Recipe recipe, PdfLabels labels)
    {
        container.Column(column =>
        {
            column.Item().Text(recipe.Name).FontSize(24).Bold().FontColor("#152B1F");
            column.Item().PaddingTop(4).Text($"{labels.Portions}: {FormatDecimal(recipe.Portions)}")
                .FontSize(9)
                .FontColor("#607167");

            var tagText = string.Join("  ", recipe.Tags
                .Select(tag => tag.TagDefinition.Name)
                .OrderBy(tag => tag));
            if (!string.IsNullOrWhiteSpace(tagText))
            {
                column.Item().PaddingTop(5).Text(tagText).FontSize(9).FontColor("#607167");
            }
        });
    }

    private static void ComposeContent(
        IContainer container,
        Recipe recipe,
        PdfLabels labels,
        byte[]? imageBytes,
        IReadOnlyCollection<PdfIngredientSection> ingredientSections,
        NutritionTotals nutrition,
        decimal? totalBaseAmount)
    {
        container.Column(column =>
        {
            column.Spacing(14);

            column.Item().Row(row =>
            {
                row.ConstantItem(145).Height(145).Element(image =>
                {
                    if (imageBytes is not null)
                    {
                        image.Border(1).BorderColor("#D7E2D2").Image(imageBytes).FitArea();
                    }
                    else
                    {
                        image.Border(1).BorderColor("#D7E2D2").Background("#EEF4EA")
                            .AlignCenter()
                            .AlignMiddle()
                            .Text(labels.NoImage)
                            .FontSize(10)
                            .FontColor("#607167");
                    }
                });

                row.RelativeItem().PaddingLeft(18).Column(description =>
                {
                    description.Item().Text(labels.Description).FontSize(11).Bold().FontColor("#315A3D");
                    description.Item().PaddingTop(7).Text(string.IsNullOrWhiteSpace(recipe.Description)
                        ? labels.NoDescription
                        : recipe.Description)
                        .LineHeight(1.25f);
                });
            });

            column.Item().Row(row =>
            {
                row.RelativeItem().Element(section => ComposeIngredients(section, ingredientSections, labels));
                row.RelativeItem().PaddingLeft(20).Element(section => ComposeInstructions(section, recipe, labels));
            });

            column.Item().Element(section => ComposeNutrition(section, nutrition, totalBaseAmount, recipe.Portions, labels));
        });
    }

    private static void ComposeIngredients(
        IContainer container,
        IReadOnlyCollection<PdfIngredientSection> sections,
        PdfLabels labels)
    {
        container.Border(1).BorderColor("#D7E2D2").Padding(14).Column(column =>
        {
            column.Item().Text(labels.Ingredients).FontSize(13).Bold().FontColor("#315A3D");
            column.Item().PaddingTop(10).Column(sectionColumn =>
            {
                sectionColumn.Spacing(10);
                foreach (var section in sections)
                {
                    sectionColumn.Item().Column(itemColumn =>
                    {
                        itemColumn.Item().Text(section.Title).FontSize(8).Bold().FontColor("#607167");

                        if (section.Rows.Count == 0)
                        {
                            itemColumn.Item().PaddingTop(4).Text(labels.NoIngredients).FontColor("#7A887F");
                            return;
                        }

                        itemColumn.Item().PaddingTop(4).Column(rows =>
                        {
                            rows.Spacing(4);
                            foreach (var row in section.Rows)
                            {
                                rows.Item().Row(line =>
                                {
                                    line.RelativeItem().Text(row.Name).SemiBold();
                                    line.ConstantItem(72).AlignRight().Text(row.Amount).FontColor("#46564D");
                                    line.ConstantItem(74).AlignRight().Text(row.Preparation).FontColor("#7A887F");
                                });
                            }
                        });
                    });
                }
            });
        });
    }

    private static void ComposeInstructions(IContainer container, Recipe recipe, PdfLabels labels)
    {
        container.Border(1).BorderColor("#D7E2D2").Padding(14).Column(column =>
        {
            column.Item().Text(labels.Instructions).FontSize(13).Bold().FontColor("#315A3D");
            column.Item().PaddingTop(10).Text(string.IsNullOrWhiteSpace(recipe.Instructions)
                ? labels.NoInstructions
                : recipe.Instructions)
                .LineHeight(1.25f);
        });
    }

    private static void ComposeNutrition(
        IContainer container,
        NutritionTotals nutrition,
        decimal? totalBaseAmount,
        decimal portions,
        PdfLabels labels)
    {
        if (!nutrition.HasValues)
        {
            return;
        }

        var baseAmount = totalBaseAmount is > 0m ? totalBaseAmount.Value : (decimal?)null;
        var caloriesPerPortion = portions > 0m && nutrition.Calories is not null
            ? nutrition.Calories / portions
            : null;
        var caloriesPer100 = baseAmount is not null && nutrition.Calories is not null
            ? nutrition.Calories / baseAmount.Value * 100m
            : null;
        var fat = SumNullable(
            nutrition.FatGrams,
            nutrition.SaturatedFatGrams,
            nutrition.MonounsaturatedFatGrams,
            nutrition.PolyunsaturatedFatGrams,
            nutrition.Omega3Grams,
            nutrition.Omega6Grams);

        container.Border(1).BorderColor("#D7E2D2").Background("#F7FAF4").Padding(12).Column(column =>
        {
            column.Spacing(8);
            column.Item().Row(row =>
            {
                row.RelativeItem().Text(labels.DietaryInformation).FontSize(11).Bold().FontColor("#315A3D");
                row.ConstantItem(180).AlignRight().Text(labels.DietaryEstimate).FontSize(8).FontColor("#7A887F");
            });

            column.Item().Row(row =>
            {
                row.RelativeItem().Text($"{labels.CaloriesPerPortion}: {FormatNutrition(caloriesPerPortion, "kcal")}");
                row.RelativeItem().Text($"{labels.CaloriesPer100}: {FormatNutrition(caloriesPer100, "kcal")}");
                row.RelativeItem().Text($"{labels.Protein}: {FormatNutrition(nutrition.ProteinGrams, "g")}");
                row.RelativeItem().Text($"{labels.Carbs}: {FormatNutrition(nutrition.CarbohydrateGrams, "g")}");
                row.RelativeItem().Text($"{labels.Fat}: {FormatNutrition(fat, "g")}");
            });
        });
    }

    private static void ComposeFooter(IContainer container, PdfLabels labels, DateTimeOffset exportedAt)
    {
        container.BorderTop(1).BorderColor("#D7E2D2").PaddingTop(8).Row(row =>
        {
            row.RelativeItem().Text($"{labels.ExportedFrom} {BrandName}").FontSize(8).FontColor("#607167");
            row.RelativeItem().AlignCenter().Text(GitHubUrl).FontSize(8).FontColor("#315A3D");
            row.RelativeItem().AlignRight().Text(exportedAt.ToString("yyyy-MM-dd", NumberCulture)).FontSize(8).FontColor("#607167");
        });
    }

    private IReadOnlyCollection<PdfIngredientSection> BuildIngredientSections(
        Recipe recipe,
        IReadOnlyCollection<Recipe> allRecipes,
        PdfLabels labels)
    {
        var sections = new List<PdfIngredientSection>
        {
            new(labels.MainRecipe, recipe.Ingredients.Select(ingredient => ToIngredientRow(ingredient, 1m, labels)).ToList())
        };

        foreach (var component in recipe.Components.OrderBy(component => component.SortOrder))
        {
            var childRecipe = allRecipes.FirstOrDefault(currentRecipe => currentRecipe.RecipeId == component.ChildRecipeId)
                ?? component.ChildRecipe;
            var scale = GetComponentScale(component.Amount, component.Unit, childRecipe);
            var title = $"{childRecipe.Name} ({FormatAmount(component.Amount, component.Unit, labels)})";
            sections.Add(new PdfIngredientSection(
                title,
                childRecipe.Ingredients.Select(ingredient => ToIngredientRow(ingredient, scale, labels)).ToList()));
        }

        return sections;
    }

    private static PdfIngredientRow ToIngredientRow(RecipeIngredient recipeIngredient, decimal multiplier, PdfLabels labels) =>
        new(
            recipeIngredient.Ingredient.IngredientName,
            FormatAmount(recipeIngredient.Amount, recipeIngredient.Unit, labels, multiplier),
            recipeIngredient.Preparation == IngredientPreparation.None
                ? string.Empty
                : labels.GetPreparation(recipeIngredient.Preparation));

    private byte[]? TryGetImageBytes(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl) || !imageUrl.StartsWith("/images/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var relativePath = imageUrl["/images/".Length..].Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(imageStorage.RootPath, relativePath));
        var rootPath = Path.GetFullPath(imageStorage.RootPath);

        if (!fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase) || !File.Exists(fullPath))
        {
            return null;
        }

        try
        {
            return File.ReadAllBytes(fullPath);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            logger.LogWarning(exception, "Could not read recipe image for PDF export at {ImagePath}.", fullPath);
            return null;
        }
    }

    private static NutritionTotals CalculateNutrition(
        Recipe recipe,
        IReadOnlyCollection<Recipe> allRecipes,
        HashSet<int> visitedRecipeIds,
        decimal multiplier)
    {
        var total = new NutritionTotals();
        if (!visitedRecipeIds.Add(recipe.RecipeId))
        {
            return total;
        }

        foreach (var recipeIngredient in recipe.Ingredients)
        {
            var nutrition = recipeIngredient.Ingredient.NutritionPer100;
            var baseAmount = ToBaseAmount(recipeIngredient.Amount, recipeIngredient.Unit);
            if (nutrition is null || baseAmount is null)
            {
                continue;
            }

            var factor = baseAmount.Value * multiplier / 100m;
            total.Calories = AddScaled(total.Calories, nutrition.Calories, factor);
            total.CarbohydrateGrams = AddScaled(total.CarbohydrateGrams, nutrition.CarbohydrateGrams, factor);
            total.ProteinGrams = AddScaled(total.ProteinGrams, nutrition.ProteinGrams, factor);
            total.FatGrams = AddScaled(total.FatGrams, nutrition.FatGrams, factor);
            total.SaturatedFatGrams = AddScaled(total.SaturatedFatGrams, nutrition.SaturatedFatGrams, factor);
            total.MonounsaturatedFatGrams = AddScaled(total.MonounsaturatedFatGrams, nutrition.MonounsaturatedFatGrams, factor);
            total.PolyunsaturatedFatGrams = AddScaled(total.PolyunsaturatedFatGrams, nutrition.PolyunsaturatedFatGrams, factor);
            total.Omega3Grams = AddScaled(total.Omega3Grams, nutrition.Omega3Grams, factor);
            total.Omega6Grams = AddScaled(total.Omega6Grams, nutrition.Omega6Grams, factor);
        }

        foreach (var component in recipe.Components)
        {
            var childRecipe = allRecipes.FirstOrDefault(currentRecipe => currentRecipe.RecipeId == component.ChildRecipeId);
            if (childRecipe is null)
            {
                continue;
            }

            var childTotal = CalculateNutrition(
                childRecipe,
                allRecipes,
                visitedRecipeIds,
                multiplier * GetComponentScale(component.Amount, component.Unit, childRecipe));
            total.Add(childTotal);
        }

        visitedRecipeIds.Remove(recipe.RecipeId);
        return total;
    }

    private static decimal? CalculateBaseAmount(
        Recipe recipe,
        IReadOnlyCollection<Recipe> allRecipes,
        HashSet<int> visitedRecipeIds,
        decimal multiplier)
    {
        if (!visitedRecipeIds.Add(recipe.RecipeId))
        {
            return null;
        }

        var total = recipe.Ingredients
            .Select(ingredient => ToBaseAmount(ingredient.Amount, ingredient.Unit))
            .Where(amount => amount is not null)
            .Sum(amount => amount!.Value * multiplier);

        foreach (var component in recipe.Components)
        {
            var childRecipe = allRecipes.FirstOrDefault(currentRecipe => currentRecipe.RecipeId == component.ChildRecipeId);
            if (childRecipe is null)
            {
                continue;
            }

            total += CalculateBaseAmount(
                childRecipe,
                allRecipes,
                visitedRecipeIds,
                multiplier * GetComponentScale(component.Amount, component.Unit, childRecipe)) ?? 0m;
        }

        visitedRecipeIds.Remove(recipe.RecipeId);
        return total > 0m ? total : null;
    }

    private static decimal GetComponentScale(decimal amount, MeasurementUnit unit, Recipe childRecipe)
    {
        var componentBaseAmount = ToBaseAmount(amount, unit);
        var childBaseAmount = GetRecipeBaseAmount(childRecipe);

        return componentBaseAmount is null || childBaseAmount is null || childBaseAmount <= 0m
            ? 1m
            : componentBaseAmount.Value / childBaseAmount.Value;
    }

    private static decimal? GetRecipeBaseAmount(Recipe recipe)
    {
        var total = recipe.Ingredients
            .Select(ingredient => ToBaseAmount(ingredient.Amount, ingredient.Unit))
            .Where(amount => amount is not null)
            .Sum(amount => amount!.Value);

        return total > 0m ? total : null;
    }

    private static decimal? ToBaseAmount(decimal? amount, MeasurementUnit unit)
    {
        if (amount is null)
        {
            return null;
        }

        return unit switch
        {
            MeasurementUnit.Gram or MeasurementUnit.Milliliter => amount.Value,
            MeasurementUnit.Kilogram or MeasurementUnit.Liter => amount.Value * 1000m,
            _ => null
        };
    }

    private static decimal? AddScaled(decimal? currentValue, decimal? value, decimal factor) =>
        value is null ? currentValue : RoundNutrition((currentValue ?? 0m) + value.Value * factor);

    private static decimal? AddScaled(decimal? currentValue, int? value, decimal factor) =>
        value is null ? currentValue : RoundNutrition((currentValue ?? 0m) + value.Value * factor);

    private static decimal RoundNutrition(decimal value) => Math.Round(value, 1, MidpointRounding.AwayFromZero);

    private static decimal? SumNullable(params decimal?[] values)
    {
        var knownValues = values.Where(value => value is not null).Select(value => value!.Value).ToList();
        return knownValues.Count == 0 ? null : knownValues.Sum();
    }

    private static string FormatAmount(decimal? amount, MeasurementUnit unit, PdfLabels labels, decimal multiplier = 1m)
    {
        if (amount is null)
        {
            return labels.GetUnit(unit);
        }

        return $"{Math.Round(amount.Value * multiplier, 0, MidpointRounding.AwayFromZero)} {labels.GetUnit(unit)}";
    }

    private static string FormatNutrition(decimal? value, string unit) =>
        value is null ? "-" : $"{FormatDecimal(value.Value)} {unit}";

    private static string FormatDecimal(decimal value) =>
        value % 1m == 0m
            ? value.ToString("0", NumberCulture)
            : value.ToString("0.#", NumberCulture);

    private static string ToSafeFileName(string value)
    {
        var safeName = Regex.Replace(value.Trim().ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(safeName) ? "matflote-recipe" : safeName;
    }
}

public sealed record RecipePdfResult(byte[] Content, string FileName);

sealed record PdfIngredientSection(string Title, IReadOnlyCollection<PdfIngredientRow> Rows);

sealed record PdfIngredientRow(string Name, string Amount, string Preparation);

sealed class NutritionTotals
{
    public decimal? Calories { get; set; }
    public decimal? CarbohydrateGrams { get; set; }
    public decimal? ProteinGrams { get; set; }
    public decimal? FatGrams { get; set; }
    public decimal? SaturatedFatGrams { get; set; }
    public decimal? MonounsaturatedFatGrams { get; set; }
    public decimal? PolyunsaturatedFatGrams { get; set; }
    public decimal? Omega3Grams { get; set; }
    public decimal? Omega6Grams { get; set; }

    public bool HasValues => Calories is not null
        || CarbohydrateGrams is not null
        || ProteinGrams is not null
        || FatGrams is not null
        || SaturatedFatGrams is not null
        || MonounsaturatedFatGrams is not null
        || PolyunsaturatedFatGrams is not null
        || Omega3Grams is not null
        || Omega6Grams is not null;

    public void Add(NutritionTotals other)
    {
        Calories = AddNullable(Calories, other.Calories);
        CarbohydrateGrams = AddNullable(CarbohydrateGrams, other.CarbohydrateGrams);
        ProteinGrams = AddNullable(ProteinGrams, other.ProteinGrams);
        FatGrams = AddNullable(FatGrams, other.FatGrams);
        SaturatedFatGrams = AddNullable(SaturatedFatGrams, other.SaturatedFatGrams);
        MonounsaturatedFatGrams = AddNullable(MonounsaturatedFatGrams, other.MonounsaturatedFatGrams);
        PolyunsaturatedFatGrams = AddNullable(PolyunsaturatedFatGrams, other.PolyunsaturatedFatGrams);
        Omega3Grams = AddNullable(Omega3Grams, other.Omega3Grams);
        Omega6Grams = AddNullable(Omega6Grams, other.Omega6Grams);
    }

    private static decimal? AddNullable(decimal? first, decimal? second) =>
        first is null ? second : second is null ? first : first.Value + second.Value;
}

sealed record PdfLabels(
    string CaloriesPer100,
    string CaloriesPerPortion,
    string Carbs,
    string Description,
    string DietaryEstimate,
    string DietaryInformation,
    string ExportedFrom,
    string Fat,
    string Ingredients,
    string Instructions,
    string MainRecipe,
    string NoDescription,
    string NoImage,
    string NoIngredients,
    string NoInstructions,
    string Portions,
    string Protein)
{
    public static PdfLabels For(string? language) =>
        string.Equals(language, "nb", StringComparison.OrdinalIgnoreCase)
            ? Norwegian
            : English;

    public string GetUnit(MeasurementUnit unit) =>
        unit switch
        {
            MeasurementUnit.Gram => "g",
            MeasurementUnit.Kilogram => "kg",
            MeasurementUnit.Milliliter => "ml",
            MeasurementUnit.Liter => "l",
            _ => unit.ToString()
        };

    public string GetPreparation(IngredientPreparation preparation) =>
        preparation switch
        {
            IngredientPreparation.Quartered => IsNorwegian ? "delt i fire" : "quartered",
            IngredientPreparation.Wedged => IsNorwegian ? "båter" : "wedged",
            IngredientPreparation.Chopped => IsNorwegian ? "hakket" : "chopped",
            IngredientPreparation.RoughlyChopped => IsNorwegian ? "grovhakket" : "roughly chopped",
            IngredientPreparation.FinelyChopped => IsNorwegian ? "finhakket" : "finely chopped",
            IngredientPreparation.Diced => IsNorwegian ? "finternet" : "diced",
            IngredientPreparation.Cubed => IsNorwegian ? "terninger" : "cubed",
            IngredientPreparation.Julienned => "julienne",
            IngredientPreparation.Batons => IsNorwegian ? "staver" : "batons",
            IngredientPreparation.Sliced => IsNorwegian ? "skivet" : "sliced",
            IngredientPreparation.Minced => IsNorwegian ? "finhakket" : "minced",
            IngredientPreparation.Grated => IsNorwegian ? "revet" : "grated",
            IngredientPreparation.Shredded => IsNorwegian ? "strimlet" : "shredded",
            IngredientPreparation.Crushed => IsNorwegian ? "knust" : "crushed",
            _ => string.Empty
        };

    private bool IsNorwegian => ReferenceEquals(this, Norwegian);

    private static readonly PdfLabels English = new(
        "Calories per 100g",
        "Calories per portion",
        "Carbs",
        "Description",
        "approximate",
        "Dietary information",
        "Exported from",
        "Fat",
        "Ingredients",
        "Instructions",
        "Main recipe",
        "No description yet.",
        "No image",
        "No ingredients added.",
        "No instructions yet.",
        "Portions",
        "Protein");

    private static readonly PdfLabels Norwegian = new(
        "Kalorier per 100g",
        "Kalorier per porsjon",
        "Karbo",
        "Beskrivelse",
        "omtrentlig",
        "Næringsinformasjon",
        "Eksportert fra",
        "Fett",
        "Ingredienser",
        "Fremgangsmåte",
        "Hovedoppskrift",
        "Ingen beskrivelse ennå.",
        "Ingen bilde",
        "Ingen ingredienser lagt til.",
        "Ingen fremgangsmåte ennå.",
        "Porsjoner",
        "Protein");
}
