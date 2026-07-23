using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/recipe-tag-categories")]
public class RecipeTagCategoriesController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RecipeTagCategoryDto>>> GetCategories()
    {
        var categories = await context.RecipeTagCategories
            .AsNoTracking()
            .Include(category => category.Tags)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .ToListAsync();

        return Ok(categories.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<RecipeTagCategoryDto>> CreateCategory(LookupRequest request)
    {
        var name = request.Name.Trim();
        var existingCategory = await context.RecipeTagCategories
            .Include(category => category.Tags)
            .FirstOrDefaultAsync(category => category.Name.ToLower() == name.ToLower());

        if (existingCategory is not null)
        {
            return Ok(ToDto(existingCategory));
        }

        var possibleDuplicate = LookupDuplicateDetector.FindNearDuplicate(
            name,
            await context.RecipeTagCategories.AsNoTracking().Select(category => category.Name).ToListAsync()
        );
        if (possibleDuplicate is not null)
        {
            return Conflict($"Possible duplicate: {possibleDuplicate}.");
        }

        var nextSortOrder = await context.RecipeTagCategories
            .Select(category => (int?)category.SortOrder)
            .MaxAsync() ?? 0;

        var category = new RecipeTagCategory
        {
            Name = name,
            SortOrder = nextSortOrder + 100
        };
        context.RecipeTagCategories.Add(category);
        await context.SaveChangesAsync();

        return Ok(ToDto(category));
    }

    [HttpPost("{categoryId:int}/tags")]
    public async Task<ActionResult<RecipeTagCategoryDto>> CreateTag(int categoryId, LookupRequest request)
    {
        var category = await context.RecipeTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.RecipeTagCategoryId == categoryId);

        if (category is null)
        {
            return NotFound();
        }

        var name = request.Name.Trim();
        var existingTag = await context.RecipeTagDefinitions
            .FirstOrDefaultAsync(tag => tag.Name.ToLower() == name.ToLower());

        if (existingTag is null)
        {
            category.Tags.Add(new RecipeTagDefinition { Name = name });
            await context.SaveChangesAsync();
        }

        return Ok(ToDto(category));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RecipeTagCategoryDto>> UpdateCategory(int id, LookupRequest request)
    {
        var category = await context.RecipeTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.RecipeTagCategoryId == id);

        if (category is null)
        {
            return NotFound();
        }

        var name = request.Name.Trim();
        var existingCategory = await context.RecipeTagCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(value => value.RecipeTagCategoryId != id && value.Name.ToLower() == name.ToLower());

        if (existingCategory is not null)
        {
            return Conflict($"Possible duplicate: {existingCategory.Name}.");
        }

        category.Name = name;
        await context.SaveChangesAsync();

        return Ok(ToDto(category));
    }

    [HttpPut("tags/{tagName}")]
    public async Task<IActionResult> UpdateTag(string tagName, LookupRequest request)
    {
        var oldName = Uri.UnescapeDataString(tagName).Trim();
        var newName = request.Name.Trim();
        var tag = await context.RecipeTagDefinitions
            .FirstOrDefaultAsync(value => value.Name.ToLower() == oldName.ToLower());

        if (tag is null)
        {
            return NotFound();
        }

        var existingTag = await context.RecipeTagDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(value => value.Name.ToLower() == newName.ToLower() && value.Name.ToLower() != oldName.ToLower());

        if (existingTag is not null)
        {
            return Conflict($"Possible duplicate: {existingTag.Name}.");
        }

        var assignments = await context.RecipeTagAssignments
            .Where(assignment => assignment.Tag.ToLower() == oldName.ToLower())
            .ToListAsync();
        var recipeIds = assignments.Select(assignment => assignment.RecipeId).Distinct().ToList();
        var existingNewAssignments = await context.RecipeTagAssignments
            .Where(assignment => assignment.Tag.ToLower() == newName.ToLower())
            .Select(assignment => assignment.RecipeId)
            .ToListAsync();
        var existingNewRecipeIds = existingNewAssignments.ToHashSet();

        tag.Name = newName;
        context.RecipeTagAssignments.RemoveRange(assignments);
        context.RecipeTagAssignments.AddRange(
            recipeIds
                .Where(recipeId => !existingNewRecipeIds.Contains(recipeId))
                .Select(recipeId => new RecipeTagAssignment
                {
                    RecipeId = recipeId,
                    Tag = newName
                })
        );

        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("tags/{tagName}")]
    public async Task<IActionResult> DeleteTag(string tagName)
    {
        var name = Uri.UnescapeDataString(tagName).Trim();
        var tags = await context.RecipeTagDefinitions
            .Where(tag => tag.Name.ToLower() == name.ToLower())
            .ToListAsync();

        if (tags.Count == 0)
        {
            return NotFound();
        }

        var assignments = await context.RecipeTagAssignments
            .Where(assignment => assignment.Tag.ToLower() == name.ToLower())
            .ToListAsync();

        context.RecipeTagDefinitions.RemoveRange(tags);
        context.RecipeTagAssignments.RemoveRange(assignments);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await context.RecipeTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.RecipeTagCategoryId == id);
        if (category is null)
        {
            return NotFound();
        }

        var tagNames = category.Tags.Select(tag => tag.Name.ToLower()).ToList();
        var assignments = await context.RecipeTagAssignments
            .Where(assignment => tagNames.Contains(assignment.Tag.ToLower()))
            .ToListAsync();

        context.RecipeTagAssignments.RemoveRange(assignments);
        context.RecipeTagCategories.Remove(category);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static RecipeTagCategoryDto ToDto(RecipeTagCategory category) => new(
        category.RecipeTagCategoryId,
        category.Name,
        category.Tags
            .OrderBy(tag => tag.Name)
            .Select(tag => tag.Name)
            .ToList()
    );
}
