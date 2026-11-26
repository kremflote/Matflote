namespace DinnerPlanner.Api.Models;

public class NutritionReferenceProfile
{
    public int NutritionReferenceProfileId { get; set; }
    public string ProfileId { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public int MinAge { get; set; }
    public int? MaxAge { get; set; }
    public string SourceUrl { get; set; } = string.Empty;
    public DateTimeOffset? SourceUpdatedAt { get; set; }
    public DateTimeOffset ImportedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<NutritionReferenceValue> ReferenceValues { get; set; } = [];
}
