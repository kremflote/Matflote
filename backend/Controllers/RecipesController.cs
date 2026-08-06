// MATFLOTE: API controller for Recipes-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController(
    DinnerPlannerContext context,
    TagCatalogService tagCatalog,
    RecipePdfService recipePdfService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeDto>>> GetRecipes()
    {
        var recipes = await RecipeDetails(asNoTracking: true)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync();

        return Ok(recipes.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecipeDto>> GetRecipe(int id)
    {
        var recipe = await RecipeDetails(asNoTracking: true)
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

        return recipe is null ? NotFound() : Ok(ToDto(recipe));
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> ExportRecipePdf(int id, [FromQuery] string? language)
    {
        var pdf = await recipePdfService.CreateRecipePdfAsync(id, language, HttpContext.RequestAborted);

        return pdf is null
            ? NotFound()
            : File(pdf.Content, "application/pdf", pdf.FileName);
    }

    [HttpPost]
    public async Task<ActionResult<RecipeDto>> CreateRecipe(RecipeRequest request)
    {
        var ingredients = await GetIngredients(GetRequestedIngredientIds(request.Ingredients));
        var missingIngredientIds = GetMissingIngredientIds(GetRequestedIngredientIds(request.Ingredients), ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var requestedComponents = NormalizeComponents(request.Components);
        var componentRecipes = await GetComponentRecipes(requestedComponents.Select(component => component.RecipeId));
        var componentValidationError = ValidateComponents(requestedComponents, componentRecipes);
        if (componentValidationError is not null)
        {
            return BadRequest(componentValidationError);
        }

        var recipe = CreateRecipeModel(request);
        recipe.Ingredients = ToRecipeIngredients(request.Ingredients);
        var knownTags = await tagCatalog.NormalizeKnownTagDefinitionsAsync(request.Tags, HttpContext.RequestAborted);
        recipe.Tags = knownTags
            .Select(tag => new RecipeTagAssignment { IngredientTagDefinitionId = tag.IngredientTagDefinitionId })
            .ToList();
        recipe.Components = ToRecipeComponents(requestedComponents);

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

        var requestedIngredientIds = GetRequestedIngredientIds(request.Ingredients);
        var ingredients = await GetIngredients(requestedIngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(requestedIngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            return BadRequest($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var requestedComponents = NormalizeComponents(request.Components);
        var componentRecipes = await GetComponentRecipes(requestedComponents.Select(component => component.RecipeId));
        var componentValidationError = ValidateComponents(requestedComponents, componentRecipes, recipe.RecipeId);
        if (componentValidationError is not null)
        {
            return BadRequest(componentValidationError);
        }

        if (await WouldCreateComponentCycle(recipe.RecipeId, requestedComponents.Select(component => component.RecipeId)))
        {
            return BadRequest("Recipe components cannot create a circular recipe reference.");
        }

        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        recipe.Portions = NormalizePortions(request.Portions);
        context.RecipeIngredients.RemoveRange(recipe.Ingredients);
        recipe.Ingredients = ToRecipeIngredients(request.Ingredients, recipe.RecipeId);
        context.RecipeTagAssignments.RemoveRange(recipe.Tags);
        var knownTags = await tagCatalog.NormalizeKnownTagDefinitionsAsync(request.Tags, HttpContext.RequestAborted);
        recipe.Tags = knownTags
            .Select(tag => new RecipeTagAssignment
            {
                RecipeId = recipe.RecipeId,
                IngredientTagDefinitionId = tag.IngredientTagDefinitionId
            })
            .ToList();
        context.RecipeComponents.RemoveRange(recipe.Components);
        recipe.Components = ToRecipeComponents(requestedComponents, recipe.RecipeId);

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

        var mealPlanEntries = await context.MealPlanEntries
            .Include(entry => entry.Recipes)
            .Where(entry => entry.Recipes.Any(planRecipe => planRecipe.RecipeId == id))
            .ToListAsync();

        foreach (var entry in mealPlanEntries)
        {
            var matchingPlanRecipes = entry.Recipes
                .Where(planRecipe => planRecipe.RecipeId == id)
                .ToList();

            context.MealPlanRecipes.RemoveRange(matchingPlanRecipes);

            if (entry.Recipes.Count == matchingPlanRecipes.Count)
            {
                context.MealPlanEntries.Remove(entry);
            }
        }

        var componentLinks = await context.RecipeComponents
            .Where(component => component.ChildRecipeId == id)
            .ToListAsync();
        context.RecipeComponents.RemoveRange(componentLinks);
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
                .ThenInclude(childRecipe => childRecipe.Ingredients)
                    .ThenInclude(recipeIngredient => recipeIngredient.Ingredient)
                        .ThenInclude(ingredient => ingredient.Tags)
                            .ThenInclude(tag => tag.TagDefinition);
    }

    private async Task<List<Recipe>> GetComponentRecipes(IEnumerable<int> recipeIds)
    {
        var ids = recipeIds.Distinct().ToList();

        return await context.Recipes
            .Where(recipe => ids.Contains(recipe.RecipeId))
            .ToListAsync();
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
        var recipe = new Recipe();

        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        recipe.Portions = NormalizePortions(request.Portions);
        return recipe;
    }

    private static RecipeDto ToDto(Recipe recipe) => new(
        recipe.RecipeId,
        recipe.Name,
        recipe.ImageUrl,
        recipe.Description,
        recipe.Instructions,
        recipe.Portions,
        recipe.Ingredients.Select(ToDto).ToList(),
        recipe.Tags.Select(recipeTag => recipeTag.TagDefinition.Name).OrderBy(tag => tag).ToList(),
        recipe.Components
            .OrderBy(component => component.SortOrder)
            .Select(ToDto)
            .ToList()
    );

    private static decimal NormalizePortions(decimal portions) => portions <= 0m ? 1m : portions;

    private static List<RecipeComponentRequest> NormalizeComponents(IReadOnlyCollection<RecipeComponentRequest>? components) =>
        components is null
            ? []
            : components
                .Where(component => component.RecipeId > 0)
                .GroupBy(component => component.RecipeId)
                .Select((group, index) =>
                {
                    var component = group.OrderBy(item => item.SortOrder).First();
                    return component with { SortOrder = component.SortOrder > 0 ? component.SortOrder : index + 1 };
                })
                .OrderBy(component => component.SortOrder)
                .ToList();

    private static string? ValidateComponents(
        IReadOnlyCollection<RecipeComponentRequest> requestedComponents,
        IReadOnlyCollection<Recipe> componentRecipes,
        int? parentRecipeId = null
    )
    {
        var foundIds = componentRecipes.Select(recipe => recipe.RecipeId).ToHashSet();
        var missingIds = requestedComponents.Select(component => component.RecipeId).Except(foundIds).ToList();
        if (missingIds.Count > 0)
        {
            return $"No component recipes found for IDs: {string.Join(", ", missingIds)}.";
        }

        if (parentRecipeId is not null && requestedComponents.Any(component => component.RecipeId == parentRecipeId.Value))
        {
            return "A recipe cannot include itself as a component.";
        }

        if (requestedComponents.Any(component => component.Amount <= 0m))
        {
            return "Recipe component amounts must be greater than zero.";
        }

        return null;
    }

    private async Task<bool> WouldCreateComponentCycle(int parentRecipeId, IEnumerable<int> childRecipeIds)
    {
        var targetChildIds = childRecipeIds.ToHashSet();
        if (targetChildIds.Count == 0)
        {
            return false;
        }

        var existingComponents = await context.RecipeComponents
            .AsNoTracking()
            .Where(component => component.ParentRecipeId != parentRecipeId)
            .Select(component => new ComponentEdge(component.ParentRecipeId, component.ChildRecipeId))
            .ToListAsync();

        return targetChildIds.Any(childId => ContainsComponentPath(childId, parentRecipeId, existingComponents));
    }

    private static bool ContainsComponentPath(
        int startRecipeId,
        int targetRecipeId,
        IReadOnlyCollection<ComponentEdge> components
    )
    {
        var seen = new HashSet<int>();
        var stack = new Stack<int>();
        stack.Push(startRecipeId);

        while (stack.Count > 0)
        {
            var currentId = stack.Pop();
            if (!seen.Add(currentId))
            {
                continue;
            }

            if (currentId == targetRecipeId)
            {
                return true;
            }

            foreach (var childId in components
                .Where(component => component.ParentRecipeId == currentId)
                .Select(component => component.ChildRecipeId))
            {
                stack.Push(childId);
            }
        }

        return false;
    }

    private record ComponentEdge(int ParentRecipeId, int ChildRecipeId);

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

    private static List<RecipeComponent> ToRecipeComponents(
        IReadOnlyCollection<RecipeComponentRequest> components,
        int parentRecipeId = 0
    ) =>
        components
            .Select((component, index) => new RecipeComponent
            {
                ParentRecipeId = parentRecipeId,
                ChildRecipeId = component.RecipeId,
                Amount = component.Amount,
                Unit = component.Unit,
                Preparation = Enum.IsDefined(component.Preparation)
                    ? component.Preparation
                    : IngredientPreparation.None,
                SortOrder = component.SortOrder > 0 ? component.SortOrder : index + 1
            })
            .ToList();

    private static RecipeIngredientDto ToDto(RecipeIngredient recipeIngredient) => new(
        recipeIngredient.RecipeIngredientId,
        ToDto(recipeIngredient.Ingredient),
        recipeIngredient.Amount,
        recipeIngredient.Unit,
        recipeIngredient.Preparation
    );

    private static RecipeComponentDto ToDto(RecipeComponent component) => new(
        component.ChildRecipe.RecipeId,
        component.ChildRecipe.Name,
        component.ChildRecipe.ImageUrl,
        component.Amount,
        component.Unit,
        component.Preparation,
        component.SortOrder,
        component.ChildRecipe.Ingredients.Select(ToDto).ToList()
    );

    private static IngredientDto ToDto(Ingredient ingredient) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Description,
        ingredient.BrandId,
        ingredient.Brand is null ? null : new BrandDto(ingredient.Brand.BrandId, ingredient.Brand.Name),
        ingredient.ImageUrl,
        ingredient.Price,
        ingredient.Tags.Select(ingredientTag => ingredientTag.TagDefinition.Name).OrderBy(tag => tag).ToList(),
        ingredient.NutritionPer100,
        ingredient.NutritionSource,
        ingredient.NutritionSourceLabel,
        ingredient.MatvaretabellenFoodId,
        ingredient.NutritionMatchedName,
        ingredient.NutritionMatchConfidence,
        ingredient.Color
    );
}
