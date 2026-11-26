namespace DinnerPlanner.Api.Models;

public class AppSetting
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
