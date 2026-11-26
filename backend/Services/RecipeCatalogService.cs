using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

/// <summary>Everything wrong with a recipe write, the components it names (normalised) and the tags it resolves to.</summary>
public sealed record RecipeValidation(
    List<string> Problems,
    List<RecipeComponentRequest> Components,
    List<IngredientTagDefinition> Tags);

/// <summary>
/// The rules behind the recipe endpoints (AUDIT C1): loading, validating, name clashes, component cycles, applying a
/// request to the model and what a delete takes with it. The controller only turns the outcomes into HTTP answers.
/// </summary>
public class RecipeCatalogService(DinnerPlannerContext context, ImageThumbnails imageThumbnails)
{
    public const string ComponentCycleMessage = "Recipe components cannot create a circular recipe reference.";

    /// <summary>A recipe with its lines (ingredient, brand and tags), tags and components loaded.</summary>
    public IQueryable<Recipe> Details(bool asNoTracking = false)
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

    public async Task<List<RecipeDto>> ListAsync(CancellationToken cancellationToken)
    {
        var recipes = await Details(asNoTracking: true)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync(cancellationToken);

        var thumbnails = await imageThumbnails.LoadAsync(cancellationToken);
        return recipes.Select(recipe => CatalogMapping.ToDto(recipe, thumbnails)).ToList();
    }

    public async Task<RecipeDto?> GetAsync(int id, CancellationToken cancellationToken)
    {
        var recipe = await Details(asNoTracking: true)
            .FirstOrDefaultAsync(recipe => recipe.RecipeId == id, cancellationToken);

        return recipe is null ? null : CatalogMapping.ToDto(recipe, await imageThumbnails.LoadAsync(cancellationToken));
    }

    /// <summary>
    /// The message for another recipe whose name is the same apart from case and spacing (AUDIT B4), or null. Compared
    /// in memory, because SQLite's lower() only folds A to Z and would treat "Ærter" and "ærter" as different.
    /// </summary>
    public async Task<string?> FindNameClashAsync(string name, int? exceptId, CancellationToken cancellationToken)
    {
        var key = CatalogNames.Key(name);
        var names = await context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.RecipeId != exceptId)
            .Select(recipe => new { recipe.RecipeId, recipe.Name })
            .ToListAsync(cancellationToken);
        var match = names.FirstOrDefault(recipe => CatalogNames.Key(recipe.Name) == key);
        return match is null
            ? null
            : $"A recipe named \"{match.Name}\" already exists (id {match.RecipeId}). Choose another name.";
    }

    /// <summary>
    /// Everything wrong with a create or update, so nothing is dropped quietly (AUDIT B2): unknown ingredients,
    /// component recipes and tags, an ingredient or component listed twice, and units or preparations that do not exist.
    /// </summary>
    public async Task<RecipeValidation> ValidateAsync(RecipeRequest request, int? recipeId, CancellationToken cancellationToken)
    {
        var problems = new List<string>();

        var requestedIngredientIds = request.Ingredients.Select(line => line.IngredientId).Distinct().ToList();
        var ingredients = await context.Ingredients
            .Where(ingredient => requestedIngredientIds.Contains(ingredient.IngredientId))
            .ToListAsync(cancellationToken);
        var missingIngredientIds = requestedIngredientIds.Except(ingredients.Select(ingredient => ingredient.IngredientId)).ToList();
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
        var componentIds = components.Select(component => component.RecipeId).Distinct().ToList();
        var componentRecipes = await context.Recipes
            .Where(recipe => componentIds.Contains(recipe.RecipeId))
            .ToListAsync(cancellationToken);
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

        var tagIndex = await TagIndex.LoadAsync(context, cancellationToken);
        var tags = tagIndex.Resolve(request.Tags, TagUse.Recipe, problems, warnings: [], TagIndex.CreateFirstHint);

        return new RecipeValidation(problems, normalizedComponents, tags);
    }

    /// <summary>The message for a rating request out of range, or null.</summary>
    public static string? ValidateRating(RecipeRatingRequest request)
    {
        if (request.Rating is < ValidationLimits.MinRating or > ValidationLimits.MaxRating)
        {
            return $"Rating must be between {ValidationLimits.MinRating} and {ValidationLimits.MaxRating}, or null to clear it.";
        }

        return CleanRatingNote(request.Note)?.Length > ValidationLimits.RatingNoteMaxLength
            ? $"The note can be at most {ValidationLimits.RatingNoteMaxLength} characters."
            : null;
    }

    /// <summary>Sets the rating and its note; the note goes with the rating, so clearing the rating clears it too.</summary>
    public static void ApplyRating(Recipe recipe, RecipeRatingRequest request)
    {
        recipe.Rating = request.Rating;
        recipe.RatingNote = request.Rating is null ? null : CleanRatingNote(request.Note);
    }

    /// <summary>Whether giving the recipe these components would make one of them contain the recipe again.</summary>
    public async Task<bool> WouldCreateComponentCycleAsync(int parentRecipeId, IEnumerable<int> childRecipeIds, CancellationToken cancellationToken)
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
            .ToListAsync(cancellationToken);

        return targetChildIds.Any(childId => ContainsComponentPath(childId, parentRecipeId, existingComponents));
    }

    /// <summary>
    /// Writes a validated request onto a new recipe or a tracked one loaded with <see cref="Details"/>, replacing its
    /// lines, tags and components.
    /// </summary>
    public void Apply(Recipe recipe, RecipeRequest request, RecipeValidation validation)
    {
        recipe.Name = request.Name;
        recipe.ImageUrl = request.ImageUrl;
        recipe.Description = request.Description;
        recipe.Instructions = request.Instructions;
        recipe.Portions = request.Portions <= 0m ? 1m : request.Portions;

        context.RecipeIngredients.RemoveRange(recipe.Ingredients);
        recipe.Ingredients = request.Ingredients
            .Select(ingredient => new RecipeIngredient
            {
                RecipeId = recipe.RecipeId,
                IngredientId = ingredient.IngredientId,
                Amount = ingredient.Amount,
                Unit = ingredient.Unit,
                Preparation = ingredient.Preparation
            })
            .ToList();

        context.RecipeTagAssignments.RemoveRange(recipe.Tags);
        recipe.Tags = validation.Tags
            .Select(tag => new RecipeTagAssignment
            {
                RecipeId = recipe.RecipeId,
                IngredientTagDefinitionId = tag.IngredientTagDefinitionId
            })
            .ToList();

        context.RecipeComponents.RemoveRange(recipe.Components);
        recipe.Components = validation.Components
            .Select((component, index) => new RecipeComponent
            {
                ParentRecipeId = recipe.RecipeId,
                ChildRecipeId = component.RecipeId,
                Amount = component.Amount,
                Unit = component.Unit,
                Preparation = component.Preparation,
                SortOrder = component.SortOrder > 0 ? component.SortOrder : index + 1
            })
            .ToList();
    }

    /// <summary>
    /// Stages the delete of a recipe: it leaves the planned meals that use it (a meal left with nothing goes too) and
    /// the recipes that use it as a component.
    /// </summary>
    public async Task StageDeleteAsync(Recipe recipe, CancellationToken cancellationToken)
    {
        var id = recipe.RecipeId;
        var mealPlanEntries = await context.MealPlanEntries
            .Include(entry => entry.Recipes)
            .Where(entry => entry.Recipes.Any(planRecipe => planRecipe.RecipeId == id))
            .ToListAsync(cancellationToken);

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
            .ToListAsync(cancellationToken);
        context.RecipeComponents.RemoveRange(componentLinks);
        context.Recipes.Remove(recipe);
    }

    private static string? CleanRatingNote(string? note) =>
        string.IsNullOrWhiteSpace(note) ? null : note.Trim();

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

    private static List<RecipeComponentRequest> NormalizeComponents(IReadOnlyCollection<RecipeComponentRequest> components) =>
        components
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
        int? parentRecipeId
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
}
