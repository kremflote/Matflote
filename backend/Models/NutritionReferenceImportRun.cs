// MATFLOTE: EF Core entity/model for NutritionReferenceImportRun data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

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
