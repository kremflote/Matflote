using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

/// <summary>
/// The rules behind the ingredient endpoints (AUDIT C1): loading, validating, name clashes and applying a request to
/// the model. The controller only turns the outcomes into HTTP answers.
/// </summary>
public class IngredientCatalogService(DinnerPlannerContext context, ImageThumbnails imageThumbnails)
{
    public async Task<List<IngredientDto>> ListAsync(CancellationToken cancellationToken)
    {
        var ingredients = await Details()
            .OrderBy(ingredient => ingredient.IngredientName)
            .ToListAsync(cancellationToken);

        var thumbnails = await imageThumbnails.LoadAsync(cancellationToken);
        return ingredients.Select(ingredient => CatalogMapping.ToDto(ingredient, thumbnails)).ToList();
    }

    public async Task<IngredientDto?> GetAsync(int id, CancellationToken cancellationToken)
    {
        var ingredient = await Details()
            .FirstOrDefaultAsync(ingredient => ingredient.IngredientId == id, cancellationToken);

        return ingredient is null ? null : CatalogMapping.ToDto(ingredient, await imageThumbnails.LoadAsync(cancellationToken));
    }

    /// <summary>
    /// The message for another ingredient with the same brand (or also without one) whose name is the same apart from
    /// case and spacing (AUDIT B4), or null. Compared in memory, because SQLite's lower() only folds A to Z.
    /// </summary>
    public async Task<string?> FindNameClashAsync(string name, int? brandId, int? exceptId, CancellationToken cancellationToken)
    {
        var key = CatalogNames.Key(name);
        var sameBrand = await context.Ingredients
            .AsNoTracking()
            .Where(ingredient => ingredient.BrandId == brandId && ingredient.IngredientId != exceptId)
            .Select(ingredient => new { ingredient.IngredientId, ingredient.IngredientName, Brand = ingredient.Brand == null ? null : ingredient.Brand.Name })
            .ToListAsync(cancellationToken);
        var match = sameBrand.FirstOrDefault(ingredient => CatalogNames.Key(ingredient.IngredientName) == key);
        if (match is null)
        {
            return null;
        }

        return match.Brand is null
            ? $"An ingredient named \"{match.IngredientName}\" without a brand already exists (id {match.IngredientId})."
            : $"An ingredient named \"{match.IngredientName}\" from {match.Brand} already exists (id {match.IngredientId}).";
    }

    /// <summary>Only a change of name or brand can clash with another ingredient.</summary>
    public static bool ChangesNameOrBrand(Ingredient ingredient, IngredientRequest request) =>
        CatalogNames.Key(request.IngredientName) != CatalogNames.Key(ingredient.IngredientName)
            || request.BrandId != ingredient.BrandId;

    /// <summary>An unknown brand or tag is an error rather than being dropped (AUDIT B2).</summary>
    public async Task<(List<string> Problems, List<IngredientTagDefinition> Tags)> ValidateAsync(
        IngredientRequest request,
        CancellationToken cancellationToken)
    {
        var problems = new List<string>();
        if (request.BrandId is not null && !await context.Brands.AnyAsync(brand => brand.BrandId == request.BrandId, cancellationToken))
        {
            problems.Add($"No brand found with ID {request.BrandId}.");
        }

        var tagIndex = await TagIndex.LoadAsync(context, cancellationToken);
        var tags = tagIndex.Resolve(request.Tags ?? [], TagUse.Ingredient, problems, warnings: [], TagIndex.CreateFirstHint);
        return (problems, tags);
    }

    /// <summary>Writes a validated request onto a new ingredient or a tracked one loaded with its tags.</summary>
    public void Apply(Ingredient ingredient, IngredientRequest request, IReadOnlyCollection<IngredientTagDefinition> tags)
    {
        ingredient.IngredientName = request.IngredientName;
        ingredient.Description = request.Description;
        ingredient.BrandId = request.BrandId;
        ingredient.ImageUrl = request.ImageUrl;
        context.IngredientTagAssignments.RemoveRange(ingredient.Tags);
        ingredient.Tags = tags
            .Select(tag => new IngredientTagAssignment
            {
                IngredientId = ingredient.IngredientId,
                IngredientTagDefinitionId = tag.IngredientTagDefinitionId
            })
            .ToList();
        ingredient.NutritionPer100 = request.NutritionPer100;
        // Nutrition entered by hand unless the request says where it came from; no nutrition, no source.
        ingredient.NutritionSource = request.NutritionPer100 is null
            ? NutritionDataSource.None
            : request.NutritionSource ?? NutritionDataSource.Manual;
        ingredient.NutritionSourceLabel = request.NutritionSourceLabel;
        ingredient.MatvaretabellenFoodId = request.MatvaretabellenFoodId;
        ingredient.NutritionMatchedName = request.NutritionMatchedName;
        ingredient.NutritionMatchConfidence = request.NutritionMatchConfidence;
        ingredient.Color = request.Color;
    }

    private IQueryable<Ingredient> Details() =>
        context.Ingredients
            .AsNoTracking()
            .Include(ingredient => ingredient.Brand)
            .Include(ingredient => ingredient.Tags)
                .ThenInclude(tag => tag.TagDefinition);
}
