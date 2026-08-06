// MATFLOTE: EF Core entity/model for ConversionRule data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class ConversionRule
{
    [Key]
    public int ConversionRuleId { get; set; }
    public string FromText { get; set; } = string.Empty;
    public string ToText { get; set; } = string.Empty;
    public string? FromTextNb { get; set; }
    public string? ToTextNb { get; set; }
    public int SortOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
