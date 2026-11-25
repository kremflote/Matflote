// MATFLOTE: API controller for Recipes-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Filters;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController(
    DinnerPlannerContext context,
    RecipePdfService recipePdfService,
    ImageThumbnails imageThumbnails) : ControllerBase
{
    [HttpGet]
    [CatalogETag(CatalogGroup.Recipes)]
    public async Task<ActionResult<IEnumerable<RecipeDto>>> GetRecipes()
    {
        var recipes = await RecipeDetails(asNoTracking: true)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync();

        var thumbnails = await imageThumbnails.LoadAsync(HttpContext.RequestAborted);
        return Ok(recipes.Select(recipe => ToDto(recipe, thumbnails)));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RecipeDto>> GetRecipe(int id)
    {
        var recipe = await RecipeDetails(asNoTracking: true)
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

        return recipe is null ? NotFound() : Ok(ToDto(recipe, await imageThumbnails.LoadAsync(HttpContext.RequestAborted)));
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
        if (await FindRecipeWithSameName(request.Name, exceptId: null) is { } clash)
        {
            return Conflict(DescribeNameClash(clash));
        }

        var validation = await ValidateRequestAsync(request, recipeId: null);
        if (validation.Problems.Count > 0)
        {
            return BadRequest(ApiErrorDto.From(validation.Problems));
        }

        var recipe = CreateRecipeModel(request);
        recipe.Ingredients = ToRecipeIngredients(request.Ingredients);
        recipe.Tags = validation.Tags
            .Select(tag => new RecipeTagAssignment { IngredientTagDefinitionId = tag.IngredientTagDefinitionId })
            .ToList();
        recipe.Components = ToRecipeComponents(validation.Components);

        context.Recipes.Add(recipe);
        await context.SaveChangesAsync();

        var created = await LoadRecipe(recipe.RecipeId);
        return CreatedAtAction(nameof(GetRecipe), new { id = recipe.RecipeId }, ToDto(created!, await imageThumbnails.LoadAsync(HttpContext.RequestAborted)));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RecipeDto>> UpdateRecipe(int id, RecipeRequest request)
    {
        var recipe = await RecipeDetails()
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

        if (recipe is null)
        {
            return NotFound();
        }

        // Renaming onto another recipe's name is refused; saving a recipe that already shares a name with another
        // (possible in data from before this check) without renaming it is allowed.
        if (CatalogNames.Key(request.Name) != CatalogNames.Key(recipe.Name)
            && await FindRecipeWithSameName(request.Name, exceptId: recipe.RecipeId) is { } clash)
        {
            return Conflict(DescribeNameClash(clash));
        }

        var validation = await ValidateRequestAsync(request, recipe.RecipeId);
        if (validation.Problems.Count > 0)
        {
            return BadRequest(ApiErrorDto.From(validation.Problems));
        }

        if (await WouldCreateComponentCycle(recipe.RecipeId, validation.Components.Select(component => component.RecipeId)))
        {
            return BadRequest(new ApiErrorDto("Recipe components cannot create a circular recipe reference."));
        }

        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        recipe.Portions = NormalizePortions(request.Portions);
        context.RecipeIngredients.RemoveRange(recipe.Ingredients);
        recipe.Ingredients = ToRecipeIngredients(request.Ingredients, recipe.RecipeId);
        context.RecipeTagAssignments.RemoveRange(recipe.Tags);
        recipe.Tags = validation.Tags
            .Select(tag => new RecipeTagAssignment
            {
                RecipeId = recipe.RecipeId,
                IngredientTagDefinitionId = tag.IngredientTagDefinitionId
            })
            .ToList();
        context.RecipeComponents.RemoveRange(recipe.Components);
        recipe.Components = ToRecipeComponents(validation.Components, recipe.RecipeId);

        await context.SaveChangesAsync();

        var updated = await LoadRecipe(recipe.RecipeId);
        return Ok(ToDto(updated!, await imageThumbnails.LoadAsync(HttpContext.RequestAborted)));
    }

    /// <summary>The household's rating, kept apart from the recipe edit so saving the recipe form never touches it.</summary>
    [HttpPut("{id:int}/rating")]
    public async Task<ActionResult<RecipeDto>> SetRating(int id, RecipeRatingRequest request)
    {
        if (request.Rating is < ValidationLimits.MinRating or > ValidationLimits.MaxRating)
        {
            return BadRequest($"Rating must be between {ValidationLimits.MinRating} and {ValidationLimits.MaxRating}, or null to clear it.");
        }

        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        if (note?.Length > ValidationLimits.RatingNoteMaxLength)
        {
            return BadRequest($"The note can be at most {ValidationLimits.RatingNoteMaxLength} characters.");
        }

        var recipe = await context.Recipes.FindAsync(id);
        if (recipe is null)
        {
            return NotFound();
        }

        recipe.Rating = request.Rating;
        recipe.RatingNote = request.Rating is null ? null : note;
        await context.SaveChangesAsync();

        return Ok(ToDto((await LoadRecipe(id))!, await imageThumbnails.LoadAsync(HttpContext.RequestAborted)));
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

    /// <summary>
    /// Everything wrong with a create or update, so nothing is dropped quietly (AUDIT B2): unknown ingredients,
    /// component recipes and tags, an ingredient or component listed twice, and units or preparations that do not exist.
    /// </summary>
    private async Task<RecipeValidation> ValidateRequestAsync(RecipeRequest request, int? recipeId)
    {
        var problems = new List<string>();

        var requestedIngredientIds = GetRequestedIngredientIds(request.Ingredients);
        var ingredients = await GetIngredients(requestedIngredientIds);
        var missingIngredientIds = GetMissingIngredientIds(requestedIngredientIds, ingredients);
        if (missingIngredientIds.Count > 0)
        {
            problems.Add($"No ingredients found for IDs: {string.Join(", ", missingIngredientIds)}.");
        }

        var ingredientNames = ingredients.ToDictionary(ingredient => ingredient.IngredientId, ingredient => ingredient.IngredientName);
        string IngredientLabel(int id) => ingredientNames.TryGetValue(id, out var name) ? $"\"{name}\"" : $"Ingredient {id}";
        foreach (var repeated in request.Ingredients.GroupBy(line => line.IngredientId).Where(group => group.Count() > 1))
        {
            problems.Add($"{IngredientLabel(repeated.Key)} is listed {repeated.Count()} times. A recipe has one line per ingredient: add the amounts into one line.");
        }

        foreach (var line in request.Ingredients)
        {
            AddLineProblems(IngredientLabel(line.IngredientId), line.Unit, line.Preparation, problems);
        }

        var components = (request.Components ?? []).ToList();
        var componentRecipes = await GetComponentRecipes(components.Select(component => component.RecipeId));
        var componentNames = componentRecipes.ToDictionary(child => child.RecipeId, child => child.Name);
        string ComponentLabel(int id) => componentNames.TryGetValue(id, out var name) ? $"Component \"{name}\"" : $"Component recipe {id}";
        foreach (var repeated in components.GroupBy(component => component.RecipeId).Where(group => group.Count() > 1))
        {
            problems.Add($"{ComponentLabel(repeated.Key)} is listed {repeated.Count()} times. Use one entry with the total amount.");
        }

        foreach (var component in components)
        {
            AddLineProblems(ComponentLabel(component.RecipeId), component.Unit, component.Preparation, problems);
        }

        var normalizedComponents = NormalizeComponents(components);
        var componentError = ValidateComponents(normalizedComponents, componentRecipes, recipeId);
        if (componentError is not null)
        {
            problems.Add(componentError);
        }

        var tagIndex = await TagIndex.LoadAsync(context, HttpContext.RequestAborted);
        var tags = tagIndex.Resolve(request.Tags, TagUse.Recipe, problems, warnings: [], TagIndex.CreateFirstHint);

        return new RecipeValidation(problems, normalizedComponents, tags);
    }

    private static void AddLineProblems(string label, MeasurementUnit unit, IngredientPreparation preparation, List<string> problems)
    {
        if (!Enum.IsDefined(unit))
        {
            problems.Add($"{label}: unit \"{(int)unit}\" is not valid. Use one of: {string.Join(", ", Enum.GetNames<MeasurementUnit>())}.");
        }

        if (!Enum.IsDefined(preparation))
        {
            problems.Add($"{label}: {RecipeLineRules.DescribeUnknownPreparation(((int)preparation).ToString())}");
        }
    }

    /// <summary>
    /// Another recipe whose name is the same apart from case and spacing (AUDIT B4). Compared in memory, because
    /// SQLite's lower() only folds A to Z and would treat "Ærter" and "ærter" as different.
    /// </summary>
    private async Task<(int RecipeId, string Name)?> FindRecipeWithSameName(string name, int? exceptId)
    {
        var key = CatalogNames.Key(name);
        var names = await context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.RecipeId != exceptId)
            .Select(recipe => new { recipe.RecipeId, recipe.Name })
            .ToListAsync(HttpContext.RequestAborted);
        var match = names.FirstOrDefault(recipe => CatalogNames.Key(recipe.Name) == key);
        return match is null ? null : (match.RecipeId, match.Name);
    }

    private static ApiErrorDto DescribeNameClash((int RecipeId, string Name) clash) =>
        new($"A recipe named \"{clash.Name}\" already exists (id {clash.RecipeId}). Choose another name.");

    private sealed record RecipeValidation(
        List<string> Problems,
        List<RecipeComponentRequest> Components,
        List<IngredientTagDefinition> Tags);

    private Task<Recipe?> LoadRecipe(int id) => RecipeDetails(asNoTracking: true)
        .FirstOrDefaultAsync(recipe => recipe.RecipeId == id);

    private IQueryable<Recipe> RecipeDetails(bool asNoTracking = false)
    {
        var query = asNoTracking
            ? context.Recipes.AsNoTracking()
            : context.Recipes;

        // Split queries: one statement per collection instead of one row per ingredient x tag x component.
        return query
            .AsSplitQuery()
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
                .ThenInclude(component => component.ChildRecipe);
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

    private static RecipeDto ToDto(Recipe recipe, IReadOnlyDictionary<string, string> thumbnails) => new(
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

    private static decimal NormalizePortions(decimal portions) => portions <= 0m ? 1m : portions;

    private static List<RecipeComponentRequest> NormalizeComponents(IReadOnlyCollection<RecipeComponentRequest>? components) =>
        components is null
            ? []
            : components
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
            .Select(ingredient => new RecipeIngredient
            {
                RecipeId = recipeId,
                IngredientId = ingredient.IngredientId,
                Amount = ingredient.Amount,
                Unit = ingredient.Unit,
                Preparation = ingredient.Preparation
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
                Preparation = component.Preparation,
                SortOrder = component.SortOrder > 0 ? component.SortOrder : index + 1
            })
            .ToList();

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

    private static RecipeIngredientSummaryDto ToSummaryDto(Ingredient ingredient, IReadOnlyDictionary<string, string> thumbnails) => new(
        ingredient.IngredientId,
        ingredient.IngredientName,
        ingredient.Brand is null ? null : new BrandDto(ingredient.Brand.BrandId, ingredient.Brand.Name),
        ingredient.ImageUrl,
        ImageThumbnails.Find(thumbnails, ingredient.ImageUrl),
        ingredient.Tags.Select(ingredientTag => ingredientTag.TagDefinition.Name).OrderBy(tag => tag).ToList(),
        ingredient.Color
    );
}
