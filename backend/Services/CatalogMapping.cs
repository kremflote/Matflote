using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Services;

/// <summary>
/// The one place catalog entities become response DTOs (AUDIT C1), so a recipe line shows an ingredient the same way
/// the ingredient list does. Expects the navigation properties loaded (brand, tags with their definitions, recipe lines).
/// </summary>
public static class CatalogMapping
{
    public static BrandDto ToDto(Brand brand) => new(brand.BrandId, brand.Name);

    public static IngredientDto ToDto(Ingredient ingredient, IReadOnlyDictionary<string, string> thumbnails) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Description,
        ingredient.BrandId,
        BrandOf(ingredient),
        ingredient.ImageUrl,
        ImageThumbnails.Find(thumbnails, ingredient.ImageUrl),
        TagNamesOf(ingredient),
        ingredient.NutritionPer100,
        ingredient.NutritionSource,
        ingredient.NutritionSourceLabel,
        ingredient.MatvaretabellenFoodId,
        ingredient.NutritionMatchedName,
        ingredient.NutritionMatchConfidence,
        ingredient.Color
    );

    /// <summary>The short form of an ingredient used inside a recipe line.</summary>
    public static RecipeIngredientSummaryDto ToSummaryDto(Ingredient ingredient, IReadOnlyDictionary<string, string> thumbnails) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        BrandOf(ingredient),
        ingredient.ImageUrl,
        ImageThumbnails.Find(thumbnails, ingredient.ImageUrl),
        TagNamesOf(ingredient),
        ingredient.Color
    );

    public static RecipeDto ToDto(Recipe recipe, IReadOnlyDictionary<string, string> thumbnails) => new(
        recipe.RecipeId,
        recipe.Name,
        recipe.ImageUrl,
        ImageThumbnails.Find(thumbnails, recipe.ImageUrl),
        recipe.Description,
        recipe.Instructions,
        recipe.Portions,
        recipe.Ingredients.Select(line => ToDto(line, thumbnails)).ToList(),
        recipe.Tags.Select(recipeTag => recipeTag.TagDefinition.Name).OrderBy(tag => tag).ToList(),
        recipe.Components
            .OrderBy(component => component.SortOrder)
            .Select(ToDto)
            .ToList(),
        recipe.Rating,
        recipe.RatingNote
    );

    public static IngredientTagCategoryDto ToDto(IngredientTagCategory category) => new(
        category.IngredientTagCategoryId,
        category.Name,
        category.SortOrder,
        category.ShowForIngredients,
        category.ShowForRecipes,
        category.Tags
            .OrderBy(tag => tag.SortOrder)
            .ThenBy(tag => tag.Name)
            .Select(tag => new IngredientTagDto(
                tag.IngredientTagDefinitionId,
                tag.Name,
                tag.SortOrder,
                tag.IsSystemTag,
                tag.SystemKey
            ))
            .ToList()
    );

    private static RecipeIngredientDto ToDto(RecipeIngredient recipeIngredient, IReadOnlyDictionary<string, string> thumbnails) => new(
        recipeIngredient.RecipeIngredientId,
        ToSummaryDto(recipeIngredient.Ingredient, thumbnails),
        recipeIngredient.Amount,
        recipeIngredient.Unit,
        recipeIngredient.Preparation
    );

    private static RecipeComponentDto ToDto(RecipeComponent component) => new(
        component.ChildRecipe.RecipeId,
        component.ChildRecipe.Name,
        component.Amount,
        component.Unit,
        component.Preparation,
        component.SortOrder
    );

    private static BrandDto? BrandOf(Ingredient ingredient) =>
        ingredient.Brand is null ? null : ToDto(ingredient.Brand);

    private static List<string> TagNamesOf(Ingredient ingredient) =>
        ingredient.Tags.Select(ingredientTag => ingredientTag.TagDefinition.Name).OrderBy(tag => tag).ToList();
}
