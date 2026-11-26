using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/seed-catalog")]
public class SeedCatalogController(SeedCatalogService seedCatalogService) : ControllerBase
{
    [HttpGet("export")]
    public async Task<IActionResult> Export(CancellationToken cancellationToken)
    {
        var catalog = await seedCatalogService.ExportCatalogAsync(cancellationToken);
        var json = seedCatalogService.Serialize(catalog);

        return File(
            System.Text.Encoding.UTF8.GetBytes(json),
            "application/json",
            "matflote-seed-catalog.json");
    }

    [HttpGet("export-package")]
    public async Task<IActionResult> ExportPackage(CancellationToken cancellationToken)
    {
        var package = await seedCatalogService.BuildExportPackageAsync(cancellationToken);

        return File(
            package,
            "application/zip",
            $"matflote-export-package-{DateTimeOffset.UtcNow:yyyyMMdd-HHmmss}.zip");
    }

    [HttpPost("import")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
    public async Task<IActionResult> Import(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest("No seed catalog file was uploaded.");
        }

        if (!Path.GetExtension(file.FileName).Equals(".json", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only .json seed catalog files are supported.");
        }

        await using var stream = file.OpenReadStream();
        await seedCatalogService.ImportCatalogStreamAsync(stream, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Adds what the package holds. Only with ?syncTags=true does it also delete the tags and tag categories
    /// the package does not name (and with them those tags on every recipe and ingredient).
    /// </summary>
    [HttpPost("import-package")]
    [RequestSizeLimit(250 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 250 * 1024 * 1024)]
    public async Task<IActionResult> ImportPackage(
        IFormFile file,
        [FromQuery] bool syncTags = false,
        CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
        {
            return BadRequest("No seed catalog package was uploaded.");
        }

        if (!Path.GetExtension(file.FileName).Equals(".zip", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only .zip seed catalog packages are supported.");
        }

        await using var stream = file.OpenReadStream();
        await seedCatalogService.ImportCatalogPackageStreamAsync(stream, syncTags, cancellationToken);
        return NoContent();
    }
}
