using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class NutritionSummaryService(DinnerPlannerContext context)
{
    public async Task<NutritionSummaryDto> GetSummaryAsync(DateOnly from, DateOnly to, string? profileId)
    {
        var profiles = await context.NutritionReferenceProfiles
            .AsNoTracking()
            .Include(profile => profile.ReferenceValues)
            .OrderBy(profile => profile.Gender)
            .ThenBy(profile => profile.MinAge)
            .ToListAsync();
        var selectedProfile = profiles.FirstOrDefault(profile => profile.ProfileId == profileId) ?? profiles.First();
        var entries = await context.MealPlanEntries
            .AsNoTracking()
            .Include(entry => entry.Recipes)
                .ThenInclude(item => item.Ingredient)
            .Where(entry => entry.Date >= from && entry.Date <= to)
            .ToListAsync();

        var recipes = await context.Recipes
            .AsNoTracking()
            .Include(recipe => recipe.Ingredients)
                .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                    .ThenInclude(ingredient => ingredient.Brand)
            .Include(recipe => recipe.Components)
                .ThenInclude(component => component.ChildRecipe)
                    .ThenInclude(childRecipe => childRecipe.Ingredients)
                        .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                            .ThenInclude(ingredient => ingredient.Brand)
            .ToDictionaryAsync(recipe => recipe.RecipeId);

        var total = new NutritionTotals();
        var missingNutrition = new Dictionary<int, MissingNutritionAccumulator>();

        foreach (var entryRecipe in entries.SelectMany(entry => entry.Recipes))
        {
            if (entryRecipe.Ingredient is not null)
            {
                AddIngredientNutrition(total, entryRecipe.Ingredient, entryRecipe.Amount, entryRecipe.Unit);
                AddMissingNutrition(missingNutrition, entryRecipe.Ingredient, "Meal plan");
                continue;
            }

            if (entryRecipe.RecipeId is null || !recipes.TryGetValue(entryRecipe.RecipeId.Value, out var recipe))
            {
                continue;
            }

            var portionFactor = GetPortionFactor(recipe, entryRecipe.Portions);
            AddRecipeNutrition(total, recipe, recipes, new HashSet<int>(), portionFactor);
            AddMissingNutrition(missingNutrition, recipe, recipes, new HashSet<int>());
        }

        return new NutritionSummaryDto(
            from,
            to,
            ToDto(selectedProfile),
            profiles.Select(ToDto).ToList(),
            BuildItems(total, selectedProfile),
            missingNutrition.Values
                .OrderBy(item => item.IngredientName)
                .Select(item => new MissingNutritionIngredientDto(
                    item.IngredientId,
                    item.IngredientName,
                    item.BrandName,
                    item.SourceRecipes.OrderBy(recipeName => recipeName).ToList()
                ))
                .ToList(),
            ToSourceDto(selectedProfile)
        );
    }

    private static void AddRecipeNutrition(
        NutritionTotals total,
        Recipe recipe,
        IReadOnlyDictionary<int, Recipe> recipesById,
        HashSet<int> visitedRecipeIds,
        decimal portionFactor = 1m
    )
    {
        if (!visitedRecipeIds.Add(recipe.RecipeId))
        {
            return;
        }

        foreach (var recipeIngredient in recipe.Ingredients)
        {
            var grams = ToGramAmount(recipeIngredient.Amount, recipeIngredient.Unit);
            AddNutrition(total, recipeIngredient.Ingredient.NutritionPer100, grams * portionFactor);
        }

        foreach (var component in recipe.Components.OrderBy(component => component.SortOrder))
        {
            if (!recipesById.TryGetValue(component.ChildRecipeId, out var childRecipe))
            {
                continue;
            }

            AddRecipeNutrition(
                total,
                childRecipe,
                recipesById,
                visitedRecipeIds,
                portionFactor * GetComponentFactor(component, childRecipe)
            );
        }

        visitedRecipeIds.Remove(recipe.RecipeId);
    }

    private static void AddIngredientNutrition(
        NutritionTotals total,
        Ingredient ingredient,
        decimal? amount,
        MeasurementUnit? unit
    )
    {
        if (unit is null)
        {
            return;
        }

        AddNutrition(total, ingredient.NutritionPer100, ToGramAmount(amount, unit.Value));
    }

    private static void AddNutrition(NutritionTotals total, NutritionFacts? nutrition, decimal? grams)
    {
            if (nutrition is null || grams is null)
            {
                return;
            }

            var factor = grams.Value / 100m;
            total.Calories = AddScaled(total.Calories, nutrition.Calories, factor);
            total.CarbohydrateGrams = AddScaled(total.CarbohydrateGrams, nutrition.CarbohydrateGrams, factor);
            total.ProteinGrams = AddScaled(total.ProteinGrams, nutrition.ProteinGrams, factor);
            total.SaltGrams = AddScaled(total.SaltGrams, nutrition.SaltGrams, factor);
            total.DietaryFiberGrams = AddScaled(total.DietaryFiberGrams, nutrition.DietaryFiberGrams, factor);
            total.SaturatedFatGrams = AddScaled(total.SaturatedFatGrams, nutrition.SaturatedFatGrams, factor);
            total.TransFatGrams = AddScaled(total.TransFatGrams, nutrition.TransFatGrams, factor);
            total.MonounsaturatedFatGrams = AddScaled(total.MonounsaturatedFatGrams, nutrition.MonounsaturatedFatGrams, factor);
            total.PolyunsaturatedFatGrams = AddScaled(total.PolyunsaturatedFatGrams, nutrition.PolyunsaturatedFatGrams, factor);
            total.Omega3Grams = AddScaled(total.Omega3Grams, nutrition.Omega3Grams, factor);
            total.Omega6Grams = AddScaled(total.Omega6Grams, nutrition.Omega6Grams, factor);
            total.CholesterolMilligrams = AddScaled(total.CholesterolMilligrams, nutrition.CholesterolMilligrams, factor);
            total.VitaminAMicrograms = AddScaled(total.VitaminAMicrograms, nutrition.VitaminAMicrograms, factor);
            total.VitaminB9Micrograms = AddScaled(total.VitaminB9Micrograms, nutrition.VitaminB9Micrograms, factor);
            total.VitaminB12Micrograms = AddScaled(total.VitaminB12Micrograms, nutrition.VitaminB12Micrograms, factor);
            total.VitaminCMilligrams = AddScaled(total.VitaminCMilligrams, nutrition.VitaminCMilligrams, factor);
            total.VitaminDMicrograms = AddScaled(total.VitaminDMicrograms, nutrition.VitaminDMicrograms, factor);
            total.VitaminEMilligrams = AddScaled(total.VitaminEMilligrams, nutrition.VitaminEMilligrams, factor);
            total.VitaminKMicrograms = AddScaled(total.VitaminKMicrograms, nutrition.VitaminKMicrograms, factor);
            total.CholineMilligrams = AddScaled(total.CholineMilligrams, nutrition.CholineMilligrams, factor);
    }

    private static void AddMissingNutrition(
        Dictionary<int, MissingNutritionAccumulator> missingNutrition,
        Recipe recipe,
        IReadOnlyDictionary<int, Recipe> recipesById,
        HashSet<int> visitedRecipeIds
    )
    {
        if (!visitedRecipeIds.Add(recipe.RecipeId))
        {
            return;
        }

        foreach (var recipeIngredient in recipe.Ingredients)
        {
            if (recipeIngredient.Ingredient.NutritionPer100 is not null)
            {
                continue;
            }

            if (!missingNutrition.TryGetValue(recipeIngredient.IngredientId, out var missingIngredient))
            {
                missingIngredient = new MissingNutritionAccumulator(
                    recipeIngredient.IngredientId,
                    recipeIngredient.Ingredient.IngredientName,
                    recipeIngredient.Ingredient.Brand?.Name
                );
                missingNutrition[recipeIngredient.IngredientId] = missingIngredient;
            }

            missingIngredient.SourceRecipes.Add(recipe.Name);
        }

        foreach (var component in recipe.Components.OrderBy(component => component.SortOrder))
        {
            if (recipesById.TryGetValue(component.ChildRecipeId, out var childRecipe))
            {
                AddMissingNutrition(missingNutrition, childRecipe, recipesById, visitedRecipeIds);
            }
        }

        visitedRecipeIds.Remove(recipe.RecipeId);
    }

    private static void AddMissingNutrition(
        Dictionary<int, MissingNutritionAccumulator> missingNutrition,
        Ingredient ingredient,
        string sourceRecipe
    )
    {
        if (ingredient.NutritionPer100 is not null)
        {
            return;
        }

        if (!missingNutrition.TryGetValue(ingredient.IngredientId, out var missingIngredient))
        {
            missingIngredient = new MissingNutritionAccumulator(
                ingredient.IngredientId,
                ingredient.IngredientName,
                ingredient.Brand?.Name
            );
            missingNutrition[ingredient.IngredientId] = missingIngredient;
        }

        missingIngredient.SourceRecipes.Add(sourceRecipe);
    }

    private static decimal GetPortionFactor(Recipe recipe, decimal? selectedPortions)
    {
        var basePortions = recipe.Portions <= 0m ? 1m : recipe.Portions;
        var portions = selectedPortions is null or <= 0m ? basePortions : selectedPortions.Value;
        return portions / basePortions;
    }

    private static decimal GetComponentFactor(RecipeComponent component, Recipe childRecipe)
    {
        var componentBaseAmount = ToBaseAmount(component.Amount, component.Unit);
        var recipeBaseAmount = GetRecipeBaseAmount(childRecipe, component.Unit);

        return componentBaseAmount is null || recipeBaseAmount is null or <= 0m
            ? 1m
            : componentBaseAmount.Value / recipeBaseAmount.Value;
    }

    private static decimal? GetRecipeBaseAmount(Recipe recipe, MeasurementUnit targetUnit)
    {
        var targetFamily = GetMeasurementFamily(targetUnit);
        if (targetFamily is null)
        {
            return null;
        }

        var total = recipe.Ingredients
            .Where(recipeIngredient => GetMeasurementFamily(recipeIngredient.Unit) == targetFamily)
            .Select(recipeIngredient => ToBaseAmount(recipeIngredient.Amount, recipeIngredient.Unit))
            .Where(amount => amount is not null)
            .Sum(amount => amount!.Value);

        return total > 0m ? total : null;
    }

    private static IReadOnlyCollection<NutritionSummaryItemDto> BuildItems(
        NutritionTotals total,
        NutritionReferenceProfile profile
    )
    {
        var dailyReferences = profile.ReferenceValues.ToDictionary(value => value.NutrientKey, StringComparer.OrdinalIgnoreCase);

        return
        [
        CreateItem("calories", "Calories", total.Calories, "kcal", null),
        CreateItem("carbohydrate", "Carbohydrate", total.CarbohydrateGrams, "g", null),
        CreateItem("protein", "Protein", total.ProteinGrams, "g", null),
        CreateItem("salt", "Salt", total.SaltGrams, "g", null),
        CreateItem("fiber", "Fiber", total.DietaryFiberGrams, "g", null),
        CreateItem("vitaminA", "Vitamin A", total.VitaminAMicrograms, "ug", GetWeeklyReference(dailyReferences, "vitaminA")),
        CreateItem("vitaminB9", "Vitamin B9", total.VitaminB9Micrograms, "ug", GetWeeklyReference(dailyReferences, "vitaminB9")),
        CreateItem("vitaminB12", "Vitamin B12", total.VitaminB12Micrograms, "ug", GetWeeklyReference(dailyReferences, "vitaminB12")),
        CreateItem("vitaminC", "Vitamin C", total.VitaminCMilligrams, "mg", GetWeeklyReference(dailyReferences, "vitaminC")),
        CreateItem("vitaminD", "Vitamin D", total.VitaminDMicrograms, "ug", GetWeeklyReference(dailyReferences, "vitaminD")),
        CreateItem("vitaminE", "Vitamin E", total.VitaminEMilligrams, "mg", GetWeeklyReference(dailyReferences, "vitaminE")),
        CreateItem("vitaminK", "Vitamin K", total.VitaminKMicrograms, "ug", GetWeeklyReference(dailyReferences, "vitaminK")),
        CreateItem("choline", "Choline", total.CholineMilligrams, "mg", GetWeeklyReference(dailyReferences, "choline"))
        ];
    }

    private static decimal? GetWeeklyReference(
        IReadOnlyDictionary<string, NutritionReferenceValue> dailyReferences,
        string nutrientKey
    ) =>
        dailyReferences.TryGetValue(nutrientKey, out var value)
            ? value.DailyAmount * 7m
            : null;

    private static NutritionSummaryItemDto CreateItem(
        string key,
        string label,
        decimal? total,
        string unit,
        decimal? recommendedWeekly
    )
    {
        decimal? percent = total is null || recommendedWeekly is null || recommendedWeekly == 0
            ? null
            : Math.Round(total.Value / recommendedWeekly.Value * 100m, 1);

        return new NutritionSummaryItemDto(
            key,
            label,
            total is null ? null : Math.Round(total.Value, 1),
            unit,
            recommendedWeekly,
            percent
        );
    }

    private static decimal? ToGramAmount(decimal? amount, MeasurementUnit unit) =>
        amount is null
            ? null
            : unit switch
            {
                MeasurementUnit.Gram => amount,
                MeasurementUnit.Kilogram => amount * 1000m,
                MeasurementUnit.Milliliter => amount,
                MeasurementUnit.Liter => amount * 1000m,
                _ => null
            };

    private static decimal? ToBaseAmount(decimal? amount, MeasurementUnit unit)
    {
        if (amount is null)
        {
            return null;
        }

        return unit switch
        {
            MeasurementUnit.Gram => amount,
            MeasurementUnit.Kilogram => amount * 1000m,
            MeasurementUnit.Milliliter => amount,
            MeasurementUnit.Liter => amount * 1000m,
            _ => null
        };
    }

    private static string? GetMeasurementFamily(MeasurementUnit unit) => unit switch
    {
        MeasurementUnit.Gram or MeasurementUnit.Kilogram => "mass",
        MeasurementUnit.Milliliter or MeasurementUnit.Liter => "volume",
        _ => null
    };

    private static decimal? AddScaled(decimal? total, decimal? value, decimal factor) =>
        value is null ? total : (total ?? 0m) + value.Value * factor;

    private static decimal? AddScaled(decimal? total, int? value, decimal factor) =>
        value is null ? total : (total ?? 0m) + value.Value * factor;

    private static NutritionProfileDto ToDto(NutritionReferenceProfile profile) => new(
        profile.ProfileId,
        profile.Label,
        profile.Gender,
        profile.MinAge,
        profile.MaxAge
    );

    private static NutritionReferenceSourceDto? ToSourceDto(NutritionReferenceProfile profile)
    {
        var firstValue = profile.ReferenceValues.FirstOrDefault();
        return string.IsNullOrWhiteSpace(profile.SourceUrl)
            ? null
            : new NutritionReferenceSourceDto(
                "Helsedirektoratet",
                profile.SourceUrl,
                profile.SourceUpdatedAt,
                profile.ImportedAt,
                firstValue?.ValueType.ToString() ?? NutritionReferenceValueType.ManualFallback.ToString()
            );
    }

    private class NutritionTotals
    {
        public decimal? Calories { get; set; }
        public decimal? CarbohydrateGrams { get; set; }
        public decimal? ProteinGrams { get; set; }
        public decimal? SaltGrams { get; set; }
        public decimal? DietaryFiberGrams { get; set; }
        public decimal? SaturatedFatGrams { get; set; }
        public decimal? TransFatGrams { get; set; }
        public decimal? MonounsaturatedFatGrams { get; set; }
        public decimal? PolyunsaturatedFatGrams { get; set; }
        public decimal? Omega3Grams { get; set; }
        public decimal? Omega6Grams { get; set; }
        public decimal? CholesterolMilligrams { get; set; }
        public decimal? VitaminAMicrograms { get; set; }
        public decimal? VitaminB9Micrograms { get; set; }
        public decimal? VitaminB12Micrograms { get; set; }
        public decimal? VitaminCMilligrams { get; set; }
        public decimal? VitaminDMicrograms { get; set; }
        public decimal? VitaminEMilligrams { get; set; }
        public decimal? VitaminKMicrograms { get; set; }
        public decimal? CholineMilligrams { get; set; }
    }

    private class MissingNutritionAccumulator(int ingredientId, string ingredientName, string? brandName)
    {
        public int IngredientId { get; } = ingredientId;
        public string IngredientName { get; } = ingredientName;
        public string? BrandName { get; } = brandName;
        public HashSet<string> SourceRecipes { get; } = [];
    }
}
