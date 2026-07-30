using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class UploadedImage
{
    [Key]
    public int UploadedImageId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public string Folder { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string? OriginalFileName { get; set; }
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
