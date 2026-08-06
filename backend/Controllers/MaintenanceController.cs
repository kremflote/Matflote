// MATFLOTE: API controller for Maintenance-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/maintenance")]
public class MaintenanceController(ImageMaintenanceService imageMaintenanceService) : ControllerBase
{
    [HttpGet("images/report")]
    public async Task<ActionResult<ImageCleanupReportDto>> GetImageCleanupReport(CancellationToken cancellationToken) =>
        Ok(await imageMaintenanceService.GetReportAsync(cancellationToken));

    [HttpPost("images/cleanup")]
    public async Task<ActionResult<ImageCleanupReportDto>> CleanupImages(CancellationToken cancellationToken) =>
        Ok(await imageMaintenanceService.CleanupAsync(cancellationToken));
}
