// MATFLOTE: EF Core entity/model for AppSetting data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

namespace DinnerPlanner.Api.Models;

public class AppSetting
{
    public string Key { get; set; } = string.Empty;
    public string? Value { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
