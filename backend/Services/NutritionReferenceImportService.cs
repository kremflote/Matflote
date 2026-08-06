// MATFLOTE: Imports nutrition reference values from Helsedirektoratet into local database tables.
// Note: Runtime nutrition pages use local references after import so normal page loads do not depend on the external API.

using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Services;

public class NutritionReferenceImportService(
    DinnerPlannerContext context,
    HelsedirektoratetContentClient helsedirektoratetContentClient,
    HelsedirektoratetNutritionReferenceParser nutritionReferenceParser)
{
    public async Task<NutritionReferenceImportResultDto> ImportFromHelsedirektoratetAsync(CancellationToken cancellationToken)
    {
        var startedAt = DateTimeOffset.UtcNow;
        var importRun = new NutritionReferenceImportRun
        {
            Provider = "Helsedirektoratet",
            Status = "Started",
            StartedAt = startedAt
        };
        context.NutritionReferenceImportRuns.Add(importRun);
        await context.SaveChangesAsync(cancellationToken);

        try
        {
            var source = await helsedirektoratetContentClient.GetNutritionReferenceSourceAsync(cancellationToken);
            var sourceUrl = string.IsNullOrWhiteSpace(source?.SourceUrl) ? NutritionReferenceDefaults.SourceUrl : source.SourceUrl;
            var importedAt = DateTimeOffset.UtcNow;
            var parsedProfiles = nutritionReferenceParser.ParseOrFallback(source?.Text);
            var profiles = BuildProfiles(parsedProfiles, sourceUrl, source?.SourceUpdatedAt, importedAt);

            context.NutritionReferenceValues.RemoveRange(context.NutritionReferenceValues);
            context.NutritionReferenceProfiles.RemoveRange(context.NutritionReferenceProfiles);
            await context.SaveChangesAsync(cancellationToken);

            context.NutritionReferenceProfiles.AddRange(profiles);

            importRun.Status = "Succeeded";
            importRun.SourceUrl = sourceUrl;
            importRun.Message = source is null
                ? "HAPI was reachable, but the reference report was not found. Refreshed MATFLOTE's bundled Helsedirektoratet reference values."
                : $"Refreshed MATFLOTE's normalized reference values using HAPI metadata for {source.Title}.";
            importRun.CompletedAt = importedAt;

            await context.SaveChangesAsync(cancellationToken);
            return new NutritionReferenceImportResultDto(
                importRun.Status,
                importRun.Message,
                profiles.Count,
                importedAt
            );
        }
        catch (Exception exception)
        {
            importRun.Status = "Failed";
            importRun.Message = exception.Message;
            importRun.CompletedAt = DateTimeOffset.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
            throw;
        }
    }

    private static List<NutritionReferenceProfile> BuildProfiles(
        IReadOnlyCollection<NutritionReferenceProfileDefinition> definitions,
        string sourceUrl,
        DateTimeOffset? sourceUpdatedAt,
        DateTimeOffset importedAt
    ) => definitions
        .Select(profile => CreateProfile(profile, sourceUrl, sourceUpdatedAt, importedAt))
        .ToList();

    private static NutritionReferenceProfile CreateProfile(
        NutritionReferenceProfileDefinition definition,
        string sourceUrl,
        DateTimeOffset? sourceUpdatedAt,
        DateTimeOffset importedAt
    ) => new()
    {
        ProfileId = definition.ProfileId,
        Label = definition.Label,
        Gender = definition.Gender,
        MinAge = definition.MinAge,
        MaxAge = definition.MaxAge,
        SourceUrl = sourceUrl,
        SourceUpdatedAt = sourceUpdatedAt,
        ImportedAt = importedAt,
        ReferenceValues = definition.Values.Select(value => new NutritionReferenceValue
        {
            NutrientKey = value.NutrientKey,
            Label = value.Label,
            DailyAmount = value.DailyAmount,
            Unit = value.Unit,
            ValueType = value.ValueType
        }).ToList()
    };
}
