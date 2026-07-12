using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/app-settings")]
public class AppSettingsController(
    AppSettingsService appSettingsService,
    VikunjaShoppingListExporter vikunjaExporter
) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AppSettingsDto>> Get(CancellationToken cancellationToken) =>
        Ok(await appSettingsService.GetAsync(cancellationToken));

    [HttpPut]
    public async Task<ActionResult<AppSettingsDto>> Update(
        [FromBody] UpdateAppSettingsRequest? request,
        CancellationToken cancellationToken
    )
    {
        if (request?.ShoppingListExport?.Vikunja is null)
        {
            return BadRequest("Settings payload is required.");
        }

        var validationError = ValidateShoppingListExportSettings(request.ShoppingListExport);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        return Ok(await appSettingsService.UpdateAsync(request, cancellationToken));
    }

    [HttpPost("test-shopping-list-export")]
    public async Task<ActionResult<TestConnectionResultDto>> TestShoppingListExport(
        [FromBody] UpdateShoppingListExportSettingsRequest? request,
        CancellationToken cancellationToken
    )
    {
        if (request?.Vikunja is null)
        {
            return BadRequest("Settings payload is required.");
        }

        var validationError = ValidateShoppingListExportSettings(request);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        try
        {
            return Ok(await vikunjaExporter.TestConnectionAsync(request, cancellationToken));
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

    private static string? ValidateShoppingListExportSettings(UpdateShoppingListExportSettingsRequest request)
    {
        if (!string.Equals(request.Provider, "Vikunja", StringComparison.OrdinalIgnoreCase))
        {
            return "Only Vikunja is supported right now.";
        }

        if (!string.Equals(request.TaskMode, ExportTaskModes.SingleTask, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(request.TaskMode, ExportTaskModes.SeparateTasks, StringComparison.OrdinalIgnoreCase))
        {
            return "Shopping list task mode is not supported.";
        }

        if (!string.IsNullOrWhiteSpace(request.Vikunja.BaseUrl)
            && !Uri.TryCreate(request.Vikunja.BaseUrl, UriKind.Absolute, out _))
        {
            return "Vikunja base URL must be an absolute URL.";
        }

        return request.Vikunja.ProjectId is <= 0
            ? "Vikunja project ID must be a positive number."
            : null;
    }
}
