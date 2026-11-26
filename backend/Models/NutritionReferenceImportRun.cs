namespace DinnerPlanner.Api.Models;

public class NutritionReferenceImportRun
{
    public int NutritionReferenceImportRunId { get; set; }
    public string Provider { get; set; } = "Helsedirektoratet";
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string? SourceUrl { get; set; }
    public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
}
