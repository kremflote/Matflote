// MATFLOTE: EF Core entity for one applied write through the assistant API (an audit row, and the undo data for meal plans).
// Note: Dry runs and rejected requests are not logged; only writes that changed data are.

namespace DinnerPlanner.Api.Models;

public class AssistantWriteLog
{
    public int AssistantWriteLogId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    /// <summary>For example "PUT /api/assistant/meal-plan".</summary>
    public string Endpoint { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    /// <summary>JSON object of counts, such as {"recipesCreated":3}.</summary>
    public string Counts { get; set; } = "{}";
    /// <summary>For meal plan writes: JSON with each touched slot as it was before and after the write. Null otherwise.</summary>
    public string? UndoState { get; set; }
    public DateTimeOffset? UndoneAt { get; set; }
}
