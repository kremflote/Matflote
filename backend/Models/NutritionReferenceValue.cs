namespace DinnerPlanner.Api.Models;

public class NutritionReferenceValue
{
    public int NutritionReferenceValueId { get; set; }
    public int NutritionReferenceProfileId { get; set; }
    public NutritionReferenceProfile Profile { get; set; } = null!;
    public string NutrientKey { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public decimal DailyAmount { get; set; }
    public string Unit { get; set; } = string.Empty;
    public NutritionReferenceValueType ValueType { get; set; }
}
