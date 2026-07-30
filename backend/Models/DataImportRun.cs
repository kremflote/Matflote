using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class DataImportRun
{
    [Key]
    public int DataImportRunId { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
    public int IngredientCount { get; set; }
    public int RecipeCount { get; set; }
    public int BrandCount { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}
