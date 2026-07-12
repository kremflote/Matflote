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
}
