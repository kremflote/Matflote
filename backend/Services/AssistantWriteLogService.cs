// MATFLOTE: Records every applied assistant write and undoes meal plan writes.
// Note: A meal plan write stores each slot it touched as it was before and after. Undo takes the newest write that
// has not been undone, checks that those slots still look as that write left them, and puts the "before" back.

using System.Globalization;
using System.Text.Json;
using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class AssistantWriteLogService(DinnerPlannerContext context, MealPlanWriter mealPlanWriter)
{
    public const int SummaryMaxLength = 500;
    public const int DefaultListLimit = 10;
    public const int MaxListLimit = 100;

    /// <summary>Older rows are deleted; a few hundred writes are years of weekly planning.</summary>
    public const int KeepRows = 200;

    public const string ImportEndpoint = "POST /api/assistant/recipes";
    public const string MealPlanEndpoint = "PUT /api/assistant/meal-plan";
    public const string UndoEndpoint = "POST /api/assistant/meal-plan/undo";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>Stages a log row; it is saved with the write it describes, in the same SaveChanges.</summary>
    public void Add(string endpoint, string summary, IReadOnlyDictionary<string, int> counts, MealPlanUndoState? undoState = null) =>
        context.AssistantWriteLogs.Add(new AssistantWriteLog
        {
            CreatedAt = DateTimeOffset.UtcNow,
            Endpoint = endpoint,
            Summary = summary.Length <= SummaryMaxLength ? summary : summary[..(SummaryMaxLength - 1)] + "…",
            Counts = JsonSerializer.Serialize(counts.Where(count => count.Value != 0).ToDictionary(), Json),
            UndoState = undoState is null || undoState.Slots.Count == 0 ? null : JsonSerializer.Serialize(undoState, Json),
        });

    public async Task PruneAsync(CancellationToken cancellationToken)
    {
        var cutoff = await context.AssistantWriteLogs
            .OrderByDescending(log => log.AssistantWriteLogId)
            .Skip(KeepRows)
            .Select(log => (int?)log.AssistantWriteLogId)
            .FirstOrDefaultAsync(cancellationToken);
        if (cutoff is not null)
        {
            await context.AssistantWriteLogs.Where(log => log.AssistantWriteLogId <= cutoff).ExecuteDeleteAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyCollection<AssistantWriteLogDto>> ListAsync(int? limit, CancellationToken cancellationToken)
    {
        var rows = await context.AssistantWriteLogs
            .AsNoTracking()
            // Ids grow with time; SQLite cannot sort DateTimeOffset columns.
            .OrderByDescending(log => log.AssistantWriteLogId)
            .Take(Math.Clamp(limit ?? DefaultListLimit, 1, MaxListLimit))
            .ToListAsync(cancellationToken);
        var nextUndoId = await NextUndoQuery().Select(log => (int?)log.AssistantWriteLogId).FirstOrDefaultAsync(cancellationToken);

        return rows
            .Select(row =>
            {
                var slots = ParseUndoState(row.UndoState)?.Slots;
                return new AssistantWriteLogDto(
                    row.AssistantWriteLogId,
                    row.CreatedAt,
                    row.Endpoint,
                    row.Summary,
                    ParseCounts(row.Counts),
                    row.UndoState is not null && row.UndoneAt is null,
                    row.AssistantWriteLogId == nextUndoId,
                    row.UndoneAt,
                    slots is null ? null : slots.Min(slot => slot.Date),
                    slots is null ? null : slots.Max(slot => slot.Date));
            })
            .ToList();
    }

    public async Task<(int StatusCode, AssistantUndoResultDto Result)> UndoMealPlanAsync(AssistantUndoRequest? request, CancellationToken cancellationToken)
    {
        var dryRun = request?.DryRun ?? false;
        var force = request?.Force ?? false;
        var log = await NextUndoQuery().FirstOrDefaultAsync(cancellationToken);
        if (log is null)
        {
            return (StatusCodes.Status404NotFound, new AssistantUndoResultDto(
                dryRun, false, null, null, null, ["There is no meal plan write to undo."], []));
        }

        var state = JsonSerializer.Deserialize<MealPlanUndoState>(log.UndoState!, Json)!;
        var first = state.Slots.Min(slot => slot.Date);
        var last = state.Slots.Max(slot => slot.Date);
        var current = (await mealPlanWriter.LoadRangeAsync(first, last, cancellationToken))
            .ToDictionary(entry => (entry.Date, entry.Slot));

        var rows = new List<AssistantUndoSlotDto>();
        var changed = new List<string>();
        foreach (var slot in state.Slots.OrderBy(slot => slot.Date).ThenBy(slot => slot.Slot))
        {
            current.TryGetValue((slot.Date, slot.Slot), out var entry);
            // A slot that already looks as it did before the write needs nothing and is no conflict.
            if (!MealSlotSnapshot.Matches(entry, slot.After) && !MealSlotSnapshot.Matches(entry, slot.Before))
            {
                changed.Add($"{slot.Date:yyyy-MM-dd} {slot.Slot}");
            }
        }

        var errors = new List<string>();
        if (changed.Count > 0 && !force)
        {
            errors.Add(
                $"These slots were changed after write {log.AssistantWriteLogId}: {string.Join(", ", changed)}. "
                + "Nothing was undone. Send \"force\": true to restore them anyway (the later changes are lost).");
        }

        var recipeIds = state.Slots.SelectMany(slot => slot.Before?.Items ?? []).Where(item => item.RecipeId is not null).Select(item => item.RecipeId!.Value).Distinct().ToList();
        var ingredientIds = state.Slots.SelectMany(slot => slot.Before?.Items ?? []).Where(item => item.IngredientId is not null).Select(item => item.IngredientId!.Value).Distinct().ToList();
        var recipeNames = await context.Recipes.AsNoTracking().Where(recipe => recipeIds.Contains(recipe.RecipeId)).ToDictionaryAsync(recipe => recipe.RecipeId, recipe => recipe.Name, cancellationToken);
        var ingredientNames = await context.Ingredients.AsNoTracking().Where(ingredient => ingredientIds.Contains(ingredient.IngredientId)).ToDictionaryAsync(ingredient => ingredient.IngredientId, ingredient => ingredient.IngredientName, cancellationToken);

        var applied = !dryRun && errors.Count == 0;
        var pending = new List<Action>();
        foreach (var slot in state.Slots.OrderBy(slot => slot.Date).ThenBy(slot => slot.Slot))
        {
            current.TryGetValue((slot.Date, slot.Slot), out var entry);
            var warnings = new List<string>();
            var changedSince = changed.Contains($"{slot.Date:yyyy-MM-dd} {slot.Slot}");
            if (changedSince)
            {
                warnings.Add("Changed after the write that is being undone.");
            }

            // Recipes or ingredients deleted since cannot come back; the rest of the meal does.
            var items = (slot.Before?.Items ?? [])
                .Where(item => item.RecipeId is null ? ingredientNames.ContainsKey(item.IngredientId ?? 0) : recipeNames.ContainsKey(item.RecipeId.Value))
                .ToList();
            var missing = (slot.Before?.Items.Count ?? 0) - items.Count;
            if (missing > 0)
            {
                warnings.Add($"{missing} item(s) refer to a recipe or ingredient that no longer exists and cannot be restored.");
            }

            var descriptions = items.Select(item => item.RecipeId is not null
                    ? $"{recipeNames[item.RecipeId.Value]} × {item.Portions?.ToString("0.##", CultureInfo.InvariantCulture)}"
                    : $"{ingredientNames[item.IngredientId!.Value]} {item.Amount?.ToString("0.##", CultureInfo.InvariantCulture)} {(item.Unit is null ? "" : AssistantUnits.ToShort(item.Unit.Value))}".TrimEnd())
                .ToList();
            var restoresSomething = items.Count > 0;
            var status = restoresSomething ? "restored" : "cleared";
            rows.Add(new AssistantUndoSlotDto(
                slot.Date,
                slot.Slot.ToString(),
                errors.Count > 0 && changedSince ? "changed_since" : applied ? status : $"would_{(restoresSomething ? "restore" : "clear")}",
                descriptions,
                warnings));

            if (restoresSomething)
            {
                pending.Add(() => mealPlanWriter.Upsert(entry, slot.Date, slot.Slot, slot.Before!.Notes, items.Select(item => item.ToModel())));
            }
            else if (entry is not null)
            {
                pending.Add(() => mealPlanWriter.Remove(entry));
            }
        }

        if (applied)
        {
            foreach (var change in pending)
            {
                change();
            }

            log.UndoneAt = DateTimeOffset.UtcNow;
            Add(
                UndoEndpoint,
                $"Undid write {log.AssistantWriteLogId} ({log.Summary})",
                new Dictionary<string, int>
                {
                    ["slotsRestored"] = rows.Count(row => row.Status == "restored"),
                    ["slotsCleared"] = rows.Count(row => row.Status == "cleared"),
                });
            await context.SaveChangesAsync(cancellationToken);
            await PruneAsync(cancellationToken);
        }

        return (
            errors.Count > 0 ? StatusCodes.Status409Conflict : StatusCodes.Status200OK,
            new AssistantUndoResultDto(dryRun, applied, log.AssistantWriteLogId, log.Summary, log.CreatedAt, errors, rows));
    }

    private IQueryable<AssistantWriteLog> NextUndoQuery() =>
        context.AssistantWriteLogs
            .Where(log => log.UndoState != null && log.UndoneAt == null)
            .OrderByDescending(log => log.AssistantWriteLogId);

    private static MealPlanUndoState? ParseUndoState(string? json)
    {
        try
        {
            return json is null ? null : JsonSerializer.Deserialize<MealPlanUndoState>(json, Json) is { Slots.Count: > 0 } state ? state : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static IReadOnlyDictionary<string, int> ParseCounts(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, int>>(json, Json) ?? [];
        }
        catch (JsonException)
        {
            return new Dictionary<string, int>();
        }
    }
}

/// <summary>What a meal plan write changed: every slot it created, replaced or cleared.</summary>
public record MealPlanUndoState(IReadOnlyCollection<MealPlanUndoSlot> Slots);

/// <summary>One slot before and after the write; null means the slot was empty.</summary>
public record MealPlanUndoSlot(DateOnly Date, MealSlot Slot, MealSlotSnapshot? Before, MealSlotSnapshot? After);

public record MealSlotSnapshot(string? Notes, IReadOnlyCollection<MealItemSnapshot> Items)
{
    public static MealSlotSnapshot? From(MealPlanEntry? entry) =>
        entry is null || entry.Recipes.Count == 0 && entry.Notes is null
            ? null
            : new MealSlotSnapshot(entry.Notes, entry.Recipes.OrderBy(item => item.SortOrder).Select(MealItemSnapshot.From).ToList());

    public static MealSlotSnapshot? From(string? notes, IReadOnlyCollection<MealPlanRecipe> items) =>
        items.Count == 0 && notes is null
            ? null
            : new MealSlotSnapshot(notes, items.OrderBy(item => item.SortOrder).Select(MealItemSnapshot.From).ToList());

    /// <summary>Whether a stored entry looks exactly like the snapshot (both empty counts as equal).</summary>
    public static bool Matches(MealPlanEntry? entry, MealSlotSnapshot? snapshot)
    {
        var currentState = From(entry);
        if (currentState is null || snapshot is null)
        {
            return currentState is null && snapshot is null;
        }

        return currentState.Notes == snapshot.Notes && currentState.Items.SequenceEqual(snapshot.Items);
    }
}

public record MealItemSnapshot(
    int? RecipeId,
    int? IngredientId,
    MealRecipeRole Role,
    int SortOrder,
    decimal? Portions,
    decimal? Amount,
    MeasurementUnit? Unit)
{
    public static MealItemSnapshot From(MealPlanRecipe item) =>
        new(item.RecipeId, item.IngredientId, item.Role, item.SortOrder, item.Portions, item.Amount, item.Unit);

    public MealPlanRecipe ToModel() => new()
    {
        RecipeId = RecipeId,
        IngredientId = IngredientId,
        Role = Role,
        SortOrder = SortOrder,
        Portions = Portions,
        Amount = Amount,
        Unit = Unit,
    };
}
