using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeDto>>> GetRecipes([FromQuery] RecipeType? type)
    {
        var recipes = await RecipeDetails(asNoTracking: true)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync();

        if (type is not null)
        {
            recipes = recipes.Where(recipe => ToType(recipe) == type.Value).ToList();
        }

        return Ok(recipes.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecipeDto>> GetRecipe(int id)
    {
        var recipe = await RecipeDetails(asNoTracking: true)
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

        return recipe is null ? NotFound() : Ok(ToDto(recipe));
    }

    [HttpPost]
    public async Task<ActionResult<RecipeDto>> CreateRecipe(RecipeRequest request)
    {
        if (!await CuisineExists(request.CuisineId))
        {
            return BadRequest("No cuisine found with that ID.");
        }

        var ingredients = await GetIngredients(GetRequestedIngredientIds(request.Ingredients));
        var missingIngredientIds = GetMissingIngredientIds(GetRequestedIngredientIds(request.Ingredients), ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var tags = NormalizeTags(request.Tags);
        if (tags.Count == 0)
        {
            return BadRequest("Choose at least one recipe tag.");
        }

        var recipe = CreateRecipeModel(request);
        recipe.Ingredients = ToRecipeIngredients(request.Ingredients);
        recipe.Tags = tags
            .Select(tag => new RecipeTagAssignment { Tag = tag })
            .ToList();

        context.Recipes.Add(recipe);
        await context.SaveChangesAsync();

        var created = await LoadRecipe(recipe.RecipeId);
        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.RecipeId }, ToDto(created!));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateRecipe(int id, RecipeRequest request)
    {
        var recipe = await RecipeDetails()
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

        if (recipe is null)
        {
            return NotFound();
        }

        if (ToType(recipe) != request.RecipeType)
        {
            return BadRequest("Recipe type cannot be changed.");
        }

        if (!await CuisineExists(request.CuisineId))
        {
            return BadRequest("No cuisine found with that ID.");
        }

        var requestedIngredientIds = GetRequestedIngredientIds(request.Ingredients);
        var ingredients = await GetIngredients(requestedIngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(requestedIngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var tags = NormalizeTags(request.Tags);
        if (tags.Count == 0)
        {
            return BadRequest("Choose at least one recipe tag.");
        }

        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        context.RecipeIngredients.RemoveRange(recipe.Ingredients);
        recipe.Ingredients = ToRecipeIngredients(request.Ingredients, recipe.RecipeId);
        ApplySpecialRecipeFields(recipe, request);
        context.RecipeTagAssignments.RemoveRange(recipe.Tags);
        recipe.Tags = tags
            .Select(tag => new RecipeTagAssignment
            {
                RecipeId = recipe.RecipeId,
                Tag = tag
            })
            .ToList();

        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRecipe(int id)
    {
        var recipe = await context.Recipes.FindAsync(id);
        if (recipe is null)
        {
            return NotFound();
        }

        context.Recipes.Remove(recipe);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private Task<Recipe?> LoadRecipe(int id) => RecipeDetails(asNoTracking: true)
        .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

    private IQueryable<Recipe> RecipeDetails(bool asNoTracking = false)
    {
        var query = asNoTracking
            ? context.Recipes.AsNoTracking()
            : context.Recipes;

        return query
        .Include(recipe => recipe.Ingredients)
            .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                .ThenInclude(ingredient => ingredient.Brand)
        .Include(recipe => recipe.Ingredients)
            .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                .ThenInclude(ingredient => ingredient.Tags)
        .Include(recipe => (recipe as Dish)!.Cuisine)
        .Include(recipe => recipe.Tags);
    }

    private async Task<List<Ingredient>> GetIngredients(IReadOnlyCollection<int> ingredientIds)
    {
        var ids = ingredientIds.Distinct().ToList();

        return await context.Ingredients
            .Where(ingredient => ids.Contains(ingredient.IngredientId))
            .ToListAsync();
    }

    private static List<int> GetRequestedIngredientIds(IReadOnlyCollection<RecipeIngredientRequest> ingredients) =>
        ingredients
            .Select(ingredient => ingredient.IngredientId)
            .Distinct()
            .ToList();

    private static List<int> GetMissingIngredientIds(
        IReadOnlyCollection<int> requestedIngredientIds,
        IReadOnlyCollection<Ingredient> ingredients
    )
    {
        var existingIds = ingredients.Select(ingredient => ingredient.IngredientId);
        return requestedIngredientIds.Distinct().Except(existingIds).ToList();
    }

    private static Recipe CreateRecipeModel(RecipeRequest request)
    {
        Recipe recipe = request.RecipeType switch
        {
            RecipeType.Dish => new Dish(),
            RecipeType.Dessert => new Dessert(),
            RecipeType.Sauce => new Sauce(),
            RecipeType.Dip => new Dip(),
            RecipeType.Side => new Side(),
            RecipeType.SpiceMix => new SpiceMix(),
            _ => throw new ArgumentOutOfRangeException(nameof(request), "Unsupported recipe type.")
        };

        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        ApplySpecialRecipeFields(recipe, request);
        return recipe;
    }

    private static void ApplySpecialRecipeFields(Recipe recipe, RecipeRequest request)
    {
        if (recipe is Dish dish)
        {
            dish.CuisineId = request.CuisineId;
            return;
        }

        if (recipe is Dessert dessert)
        {
            dessert.Type = request.DessertType ?? DessertType.Other;
        }
    }

    private static RecipeDto ToDto(Recipe recipe) => new(
        recipe.RecipeId,
        ToType(recipe),
        recipe.Name,
        recipe.ImageUrl,
        recipe.Description,
        recipe.Instructions,
        recipe.Ingredients.Select(ToDto).ToList(),
        recipe.Tags.Select(recipeTag => recipeTag.Tag).OrderBy(tag => tag).ToList(),
        recipe is Dish dish ? dish.CuisineId : null,
        recipe is Dish { Cuisine: not null } dishWithCuisine
            ? new CuisineDto(dishWithCuisine.Cuisine.CuisineId, dishWithCuisine.Cuisine.Name)
            : null,
        recipe is Dessert dessert ? dessert.Type : null
    );

    private static RecipeType ToType(Recipe recipe) => recipe switch
    {
        Dish => RecipeType.Dish,
        Dessert => RecipeType.Dessert,
        Sauce => RecipeType.Sauce,
        Dip => RecipeType.Dip,
        Side => RecipeType.Side,
        SpiceMix => RecipeType.SpiceMix,
        _ => throw new ArgumentOutOfRangeException(nameof(recipe), "Unsupported recipe type.")
    };

    private static List<RecipeTag> NormalizeTags(IReadOnlyCollection<RecipeTag>? tags) =>
        tags is null
            ? []
            : tags
                .Where(tag => Enum.IsDefined(tag))
                .Distinct()
                .ToList();

    private static List<RecipeIngredient> ToRecipeIngredients(
        IReadOnlyCollection<RecipeIngredientRequest> ingredients,
        int recipeId = 0
    ) =>
        ingredients
            .GroupBy(ingredient => ingredient.IngredientId)
            .Select(group => group.First())
            .Select(ingredient => new RecipeIngredient
            {
                RecipeId = recipeId,
                IngredientId = ingredient.IngredientId,
                Amount = ingredient.Amount,
                Unit = ingredient.Unit,
                Preparation = Enum.IsDefined(ingredient.Preparation)
                    ? ingredient.Preparation
                    : IngredientPreparation.None
            })
            .ToList();

    private static RecipeIngredientDto ToDto(RecipeIngredient recipeIngredient) => new(
        recipeIngredient.RecipeIngredientId,
        ToDto(recipeIngredient.Ingredient),
        recipeIngredient.Amount,
        recipeIngredient.Unit,
        recipeIngredient.Preparation
    );

    private async Task<bool> CuisineExists(int? cuisineId) =>
        cuisineId is null || await context.Cuisines.AnyAsync(cuisine => cuisine.CuisineId == cuisineId);

    private static IngredientDto ToDto(Ingredient ingredient) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Description,
        ingredient.BrandId,
        ingredient.Brand is null ? null : new BrandDto(ingredient.Brand.BrandId, ingredient.Brand.Name),
        ingredient.Price,
        ingredient.Tags.Select(ingredientTag => ingredientTag.Tag).OrderBy(tag => tag).ToList(),
        ingredient.NutritionPer100,
        ingredient.Color
    );
}
