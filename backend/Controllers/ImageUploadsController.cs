using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageUploadsController(ImageStoragePathProvider imageStorage) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private static readonly HashSet<string> AllowedFolders = new(StringComparer.OrdinalIgnoreCase)
    {
        "general",
        "ingredients",
        "recipes"
    };

    [HttpPost]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<ImageUploadDto>> UploadImage(IFormFile file, [FromForm] string folder = "general")
    {
        if (file.Length == 0)
        {
            return BadRequest("No image file was uploaded.");
        }

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest("Only .jpg, .jpeg, .png, and .webp images are supported.");
        }

        var safeFolder = MakeSafePathSegment(folder);
        if (!AllowedFolders.Contains(safeFolder))
        {
            return BadRequest($"Unsupported image folder. Use one of: {string.Join(", ", AllowedFolders.Order())}.");
        }

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var uploadFolder = imageStorage.GetFolderPath(safeFolder);

        Directory.CreateDirectory(uploadFolder);

        var filePath = Path.Combine(uploadFolder, fileName);
        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        var url = $"/images/{safeFolder}/{fileName}";
        return Ok(new ImageUploadDto(fileName, url));
    }

    private static string MakeSafePathSegment(string value)
    {
        var safeChars = value
            .Where(character => char.IsLetterOrDigit(character) || character is '-' or '_')
            .ToArray();

        var safeValue = new string(safeChars);
        return string.IsNullOrWhiteSpace(safeValue) ? "general" : safeValue.ToLowerInvariant();
    }
}
