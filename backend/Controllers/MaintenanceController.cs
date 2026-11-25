// MATFLOTE: API controller for Maintenance-related frontend and integration requests.
// Note: Controllers stay thin where possible and delegate heavier business rules to services or EF model helpers.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/maintenance")]
public class MaintenanceController(
    ImageMaintenanceService imageMaintenanceService,
    DinnerPlannerContext context) : ControllerBase
{
    [HttpGet("images/report")]
    public async Task<ActionResult<ImageCleanupReportDto>> GetImageCleanupReport(CancellationToken cancellationToken) =>
        Ok(await imageMaintenanceService.GetReportAsync(cancellationToken));

    [HttpGet("images/missing-thumbnails")]
    public async Task<ActionResult<ImagesWithoutThumbnailsDto>> GetImagesWithoutThumbnails(CancellationToken cancellationToken) =>
        Ok(await imageMaintenanceService.GetImagesWithoutThumbnailsAsync(cancellationToken));

    [HttpPost("images/cleanup")]
    public async Task<ActionResult<ImageCleanupReportDto>> CleanupImages(CancellationToken cancellationToken) =>
        Ok(await imageMaintenanceService.CleanupAsync(cancellationToken));

    /// <summary>
    /// Writes a consistent copy of the database to <c>backups/&lt;name&gt;.latest.db</c> beside it
    /// (in Docker, <c>/data/backups/dinnerplanner.latest.db</c>), for a file backup to pick up.
    /// </summary>
    [HttpPost("backup")]
    public async Task<ActionResult<DatabaseBackupDto>> BackUpDatabase(CancellationToken cancellationToken)
    {
        var connectionString = context.Database.GetConnectionString();
        var databasePath = connectionString is null ? null : DatabaseBackup.ResolveDatabasePath(connectionString);
        if (connectionString is null || databasePath is null)
        {
            return Problem("The database is not a file, so there is nothing to back up.", statusCode: StatusCodes.Status409Conflict);
        }

        var path = await DatabaseBackup.CreateLatestAsync(connectionString, databasePath, cancellationToken);
        var file = new FileInfo(path);
        return Ok(new DatabaseBackupDto(file.FullName, file.Length, new DateTimeOffset(file.LastWriteTimeUtc)));
    }
}
