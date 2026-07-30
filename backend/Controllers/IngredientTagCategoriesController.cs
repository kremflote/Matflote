using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/ingredient-tag-categories")]
public class IngredientTagCategoriesController(DinnerPlannerContext context, TagCatalogService tagCatalog) : ControllerBase
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

        return Ok(categories.Select(ToDto).ToList());
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
            var nextSortOrder = category.Tags.Count == 0
                ? 100
                : category.Tags.Max(tag => tag.SortOrder) + 100;
            category.Tags.Add(new IngredientTagDefinition
            {
                Name = name,
                SortOrder = nextSortOrder
            });
            await context.SaveChangesAsync();
        }

        return Ok(ToDto(category));
    }

    [HttpPost("{id:int}/move")]
    public async Task<ActionResult<IEnumerable<IngredientTagCategoryDto>>> MoveCategory(int id, MoveLookupRequest request)
    {
        var categories = await context.IngredientTagCategories
            .Include(category => category.Tags)
            .OrderBy(category => category.SortOrder)
            .ThenBy(category => category.Name)
            .ToListAsync();

        var index = categories.FindIndex(category => category.IngredientTagCategoryId == id);
        if (index < 0)
        {
            return NotFound();
        }

        var targetIndex = request.Direction == "Up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= categories.Count)
        {
            return Ok(categories.Select(ToDto).ToList());
        }

        (categories[index], categories[targetIndex]) = (categories[targetIndex], categories[index]);
        ApplySortOrder(categories);
        await context.SaveChangesAsync();

        return Ok(categories.Select(ToDto).ToList());
    }

    [HttpPost("tags/{tagId:int}/move")]
    public async Task<ActionResult<IngredientTagCategoryDto>> MoveTag(int tagId, MoveLookupRequest request)
    {
        var tag = await context.IngredientTagDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(value => value.IngredientTagDefinitionId == tagId);
        if (tag is null)
        {
            return NotFound();
        }

        var category = await context.IngredientTagCategories
            .Include(value => value.Tags)
            .FirstOrDefaultAsync(value => value.IngredientTagCategoryId == tag.IngredientTagCategoryId);
        if (category is null)
        {
            return NotFound();
        }

        var tags = category.Tags
            .OrderBy(value => value.SortOrder)
            .ThenBy(value => value.Name)
            .ToList();
        var index = tags.FindIndex(value => value.IngredientTagDefinitionId == tagId);
        var targetIndex = request.Direction == "Up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= tags.Count)
        {
            return Ok(ToDto(category));
        }

        (tags[index], tags[targetIndex]) = (tags[targetIndex], tags[index]);
        ApplySortOrder(tags);
        await context.SaveChangesAsync();

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

        var existingTag = await context.IngredientTagDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(value => value.Name.ToLower() == newName.ToLower() && value.Name.ToLower() != oldName.ToLower());

        if (existingTag is not null)
        {
            return Conflict($"Possible duplicate: {existingTag.Name}.");
        }

        if (tag is not null)
        {
            tag.Name = newName;
        }

        if (tag is null)
        {
            return NotFound();
        }

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

        context.IngredientTagDefinitions.RemoveRange(tags);
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

        var tagNames = category.Tags.Select(tag => tag.Name).ToList();
        await tagCatalog.DeleteTagAssignmentsAsync(tagNames, HttpContext.RequestAborted);
        context.IngredientTagCategories.Remove(category);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static IngredientTagCategoryDto ToDto(IngredientTagCategory category) => new(
        category.IngredientTagCategoryId,
        category.Name,
        category.SortOrder,
        category.Tags
            .OrderBy(tag => tag.SortOrder)
            .ThenBy(tag => tag.Name)
            .Select(tag => new IngredientTagDto(tag.IngredientTagDefinitionId, tag.Name, tag.SortOrder))
            .ToList()
    );

    private static void ApplySortOrder(IReadOnlyList<IngredientTagCategory> categories)
    {
        for (var index = 0; index < categories.Count; index++)
        {
            categories[index].SortOrder = (index + 1) * 100;
        }
    }

    private static void ApplySortOrder(IReadOnlyList<IngredientTagDefinition> tags)
    {
        for (var index = 0; index < tags.Count; index++)
        {
            tags[index].SortOrder = (index + 1) * 100;
        }
    }
}
