using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/ingredient-tag-categories")]
public class IngredientTagCategoriesController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IngredientTagCategoryDto>>> GetCategories()
    {
        var categories = await context.IngredientTagCategories
            .AsNoTracking()
            .Include(category => category.Tags)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .ToListAsync();

        return Ok(categories.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<IngredientTagCategoryDto>> CreateCategory(LookupRequest request)
    {
        var name = request.Name.Trim();
        var existingCategory = await context.IngredientTagCategories
            .Include(category => category.Tags)
            .FirstOrDefaultAsync(category => category.Name.ToLower() == name.ToLower());

        if (existingCategory is not null)
        {
            return Ok(ToDto(existingCategory));
        }

        var possibleDuplicate = LookupDuplicateDetector.FindNearDuplicate(
            name,
            await context.IngredientTagCategories.AsNoTracking().Select(category => category.Name).ToListAsync()
        );
        if (possibleDuplicate is not null)
        {
            return Conflict($"Possible duplicate: {possibleDuplicate}.");
        }

        var nextSortOrder = await context.IngredientTagCategories
            .Select(category => (int?)category.SortOrder)
            .MaxAsync() ?? 0;

        var category = new IngredientTagCategory
        {
            Name = name,
            SortOrder = nextSortOrder + 100
        };
        context.IngredientTagCategories.Add(category);
        await context.SaveChangesAsync();

        return Ok(ToDto(category));
    }

    [HttpPost("{categoryId:int}/tags")]
    public async Task<ActionResult<IngredientTagCategoryDto>> CreateTag(int categoryId, LookupRequest request)
    {
        var category = await context.IngredientTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.IngredientTagCategoryId == categoryId);

        if (category is null)
        {
            return NotFound();
        }

        var name = request.Name.Trim();
        var existingTag = await context.IngredientTagDefinitions
            .FirstOrDefaultAsync(tag => tag.Name.ToLower() == name.ToLower());

        if (existingTag is null)
        {
            category.Tags.Add(new IngredientTagDefinition { Name = name });
            await context.SaveChangesAsync();
        }

        return Ok(ToDto(category));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<IngredientTagCategoryDto>> UpdateCategory(int id, LookupRequest request)
    {
        var category = await context.IngredientTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.IngredientTagCategoryId == id);

        if (category is null)
        {
            return NotFound();
        }

        var name = request.Name.Trim();
        var existingCategory = await context.IngredientTagCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(value => value.IngredientTagCategoryId != id && value.Name.ToLower() == name.ToLower());

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
        var tag = await context.IngredientTagDefinitions
            .FirstOrDefaultAsync(value => value.Name.ToLower() == oldName.ToLower());

        if (tag is null)
        {
            return NotFound();
        }

        var existingTag = await context.IngredientTagDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(value => value.Name.ToLower() == newName.ToLower() && value.Name.ToLower() != oldName.ToLower());

        if (existingTag is not null)
        {
            return Conflict($"Possible duplicate: {existingTag.Name}.");
        }

        var assignments = await context.IngredientTagAssignments
            .Where(assignment => assignment.Tag.ToLower() == oldName.ToLower())
            .ToListAsync();
        var ingredientIds = assignments.Select(assignment => assignment.IngredientId).Distinct().ToList();
        var existingNewAssignments = await context.IngredientTagAssignments
            .Where(assignment => assignment.Tag.ToLower() == newName.ToLower())
            .Select(assignment => assignment.IngredientId)
            .ToListAsync();
        var existingNewIngredientIds = existingNewAssignments.ToHashSet();

        tag.Name = newName;
        context.IngredientTagAssignments.RemoveRange(assignments);
        context.IngredientTagAssignments.AddRange(
            ingredientIds
                .Where(ingredientId => !existingNewIngredientIds.Contains(ingredientId))
                .Select(ingredientId => new IngredientTagAssignment
                {
                    IngredientId = ingredientId,
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
        var tags = await context.IngredientTagDefinitions
            .Where(tag => tag.Name.ToLower() == name.ToLower())
            .ToListAsync();

        if (tags.Count == 0)
        {
            return NotFound();
        }

        var assignments = await context.IngredientTagAssignments
            .Where(assignment => assignment.Tag.ToLower() == name.ToLower())
            .ToListAsync();

        context.IngredientTagDefinitions.RemoveRange(tags);
        context.IngredientTagAssignments.RemoveRange(assignments);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await context.IngredientTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.IngredientTagCategoryId == id);
        if (category is null)
        {
            return NotFound();
        }

        var tagNames = category.Tags.Select(tag => tag.Name.ToLower()).ToList();
        var assignments = await context.IngredientTagAssignments
            .Where(assignment => tagNames.Contains(assignment.Tag.ToLower()))
            .ToListAsync();

        context.IngredientTagAssignments.RemoveRange(assignments);
        context.IngredientTagCategories.Remove(category);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static IngredientTagCategoryDto ToDto(IngredientTagCategory category) => new(
        category.IngredientTagCategoryId,
        category.Name,
        category.Tags
            .OrderBy(tag => tag.Name)
            .Select(tag => tag.Name)
            .ToList()
    );
}
