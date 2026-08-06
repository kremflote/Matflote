// MATFLOTE: Request/response contracts for ConversionRule API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Dtos;

public record ConversionRuleDto(
    int ConversionRuleId,
    string FromText,
    string ToText,
    string? FromTextNb,
    string? ToTextNb,
    int SortOrder
);

public record ConversionRuleRequest(
    [Required]
    [StringLength(120, MinimumLength = 1)]
    string FromText,

    [Required]
    [StringLength(120, MinimumLength = 1)]
    string ToText
);
