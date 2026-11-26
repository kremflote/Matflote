using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GroceryListsController(
    GroceryListService groceryListService,
    ShoppingListExportService shoppingListExportService
) : ControllerBase
{
    [HttpGet("preview")]
    public async Task<ActionResult<GroceryListDto>> Preview(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken cancellationToken
    )
    {
        if (from > to)
        {
            return BadRequest("'from' must be before or equal to 'to'.");
        }

        return Ok(await groceryListService.BuildAsync(from, to, cancellationToken));
    }

    [HttpPost("export")]
    public async Task<IActionResult> Export(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        CancellationToken cancellationToken
    )
    {
        if (from > to)
        {
            return BadRequest("'from' must be before or equal to 'to'.");
        }

        var groceryList = await groceryListService.BuildAsync(from, to, cancellationToken);

        return await ExportList(groceryList, cancellationToken);
    }

    [HttpPost("export/selected")]
    public async Task<IActionResult> ExportSelected(
        [FromBody] GroceryListExportRequest request,
        CancellationToken cancellationToken
    )
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (request.GroceryList.From > request.GroceryList.To)
        {
            return BadRequest("'from' must be before or equal to 'to'.");
        }

        var hydratedGroceryList = await HydrateSelectedListSources(request.GroceryList, cancellationToken);

        return await ExportList(hydratedGroceryList, cancellationToken);
    }

    private async Task<IActionResult> ExportList(GroceryListDto groceryList, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await shoppingListExportService.ExportAsync(groceryList, cancellationToken));
        }
        catch (ShoppingListExportConfigurationException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (HttpRequestException exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, exception.Message);
        }
    }

    private async Task<GroceryListDto> HydrateSelectedListSources(
        GroceryListDto selectedGroceryList,
        CancellationToken cancellationToken
    )
    {
        var fullGroceryList = await groceryListService.BuildAsync(
            selectedGroceryList.From,
            selectedGroceryList.To,
            cancellationToken);
        var fullItemsByKey = fullGroceryList.Sections
            .SelectMany(section => section.Items)
            .ToDictionary(GetGroceryListItemKey);

        return selectedGroceryList with
        {
            Sections = selectedGroceryList.Sections
                .Select(section => section with
                {
                    Items = section.Items
                        .Select(item =>
                        {
                            if (!fullItemsByKey.TryGetValue(GetGroceryListItemKey(item), out var fullItem))
                            {
                                return item;
                            }

                            return item with
                            {
                                BrandName = string.IsNullOrWhiteSpace(item.BrandName)
                                    ? fullItem.BrandName
                                    : item.BrandName,
                                SourceRecipes = item.SourceRecipes.Count > 0
                                    ? item.SourceRecipes
                                    : fullItem.SourceRecipes,
                                Tags = item.Tags.Count > 0
                                    ? item.Tags
                                    : fullItem.Tags
                            };
                        })
                        .ToList()
                })
                .ToList()
        };
    }

    private static string GetGroceryListItemKey(GroceryListItemDto item) =>
        $"{item.IngredientId}::{item.Unit}::{item.DisplayAmount}";
}
