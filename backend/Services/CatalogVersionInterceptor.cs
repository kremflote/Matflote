// MATFLOTE: Bumps the catalog version counters after every save that touches catalog data.
// Note: Changed types are collected before the save and counters are bumped only after it, so a list read
// between the commit and the bump is never cached under a validator that will not change again.

using System.Runtime.CompilerServices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DinnerPlanner.Api.Services;

public sealed class CatalogVersionInterceptor(CatalogVersion catalogVersion) : SaveChangesInterceptor
{
    private readonly ConditionalWeakTable<DbContext, HashSet<CatalogGroup>> pendingGroups = new();

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Collect(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Collect(eventData.Context);
        return ValueTask.FromResult(result);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        Flush(eventData.Context);
        return result;
    }

    public override ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        Flush(eventData.Context);
        return ValueTask.FromResult(result);
    }

    // A failed save is rolled back, but bumping anyway costs one extra full response and can never serve stale data.
    public override void SaveChangesFailed(DbContextErrorEventData eventData) => Flush(eventData.Context);

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
    {
        Flush(eventData.Context);
        return Task.CompletedTask;
    }

    private void Collect(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var groups = pendingGroups.GetOrCreateValue(context);
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            {
                groups.UnionWith(CatalogVersion.GroupsAffectedBy(entry.Metadata.ClrType));
            }
        }
    }

    private void Flush(DbContext? context)
    {
        if (context is null || !pendingGroups.TryGetValue(context, out var groups))
        {
            return;
        }

        pendingGroups.Remove(context);
        catalogVersion.Bump(groups);
    }
}
