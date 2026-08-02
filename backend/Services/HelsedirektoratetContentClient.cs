using System.Text.Json;

namespace DinnerPlanner.Api.Services;

public class HelsedirektoratetContentClient(
    HttpClient httpClient,
    AppSettingsService appSettingsService,
    ILogger<HelsedirektoratetContentClient> logger)
{
    private const string SubscriptionHeader = "Ocp-Apim-Subscription-Key";
    private const string NutritionReferenceTitle = "Referanseverdier for energi og næringsstoffer";

    public async Task<HelsedirektoratetContentSource?> GetNutritionReferenceSourceAsync(CancellationToken cancellationToken)
    {
        var subscriptionKey = await appSettingsService.GetValueAsync(AppSettingKeys.HelsedirektoratetSubscriptionKey, cancellationToken);
        if (string.IsNullOrWhiteSpace(subscriptionKey))
        {
            throw new HelsedirektoratetConfigurationException("Helsedirektoratet subscription key is not configured.");
        }

        var baseUrl = (await appSettingsService.GetValueAsync(AppSettingKeys.HelsedirektoratetBaseUrl, cancellationToken))?.Trim();
        httpClient.BaseAddress = new Uri(string.IsNullOrWhiteSpace(baseUrl)
            ? "https://api.helsedirektoratet.no/"
            : baseUrl.TrimEnd('/') + "/");

        using var request = new HttpRequestMessage(HttpMethod.Get, "innhold/innhold?infoTyper=rapport");
        request.Headers.TryAddWithoutValidation(SubscriptionHeader, subscriptionKey);
        request.Headers.TryAddWithoutValidation("Accept", "application/json");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = $"Helsedirektoratet returned {(int)response.StatusCode} {response.ReasonPhrase}.";
            logger.LogWarning("{Message}", message);
            throw new HelsedirektoratetRequestException(message);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var match = FindObjectWithTitle(document.RootElement, NutritionReferenceTitle);
        if (match is null)
        {
            return null;
        }

        return new HelsedirektoratetContentSource(
            ReadString(match.Value, "tittel") ?? ReadString(match.Value, "title") ?? NutritionReferenceTitle,
            ReadString(match.Value, "url") ?? ReadString(match.Value, "canonicalUrl") ?? ReadFirstLink(match.Value),
            ReadDate(match.Value, "sistFagligOppdatert") ?? ReadDate(match.Value, "sistOppdatert"),
            ReadString(match.Value, "tekst")
        );
    }

    private static JsonElement? FindObjectWithTitle(JsonElement element, string title)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            var objectTitle = ReadString(element, "tittel") ?? ReadString(element, "title");
            if (!string.IsNullOrWhiteSpace(objectTitle) &&
                objectTitle.Contains(title, StringComparison.OrdinalIgnoreCase))
            {
                return element;
            }

            foreach (var property in element.EnumerateObject())
            {
                var match = FindObjectWithTitle(property.Value, title);
                if (match is not null)
                {
                    return match;
                }
            }
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                var match = FindObjectWithTitle(item, title);
                if (match is not null)
                {
                    return match;
                }
            }
        }

        return null;
    }

    private static string? ReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private static string? ReadFirstLink(JsonElement element)
    {
        if (!element.TryGetProperty("links", out var links))
        {
            return null;
        }

        return FindFirstUrl(links);
    }

    private static string? FindFirstUrl(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            var value = element.GetString();
            return string.IsNullOrWhiteSpace(value) || !value.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? null
                : value;
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                var value = FindFirstUrl(property.Value);
                if (value is not null)
                {
                    return value;
                }
            }
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in element.EnumerateArray())
            {
                var value = FindFirstUrl(item);
                if (value is not null)
                {
                    return value;
                }
            }
        }

        return null;
    }

    private static DateTimeOffset? ReadDate(JsonElement element, string propertyName)
    {
        var value = ReadString(element, propertyName);
        return DateTimeOffset.TryParse(value, out var date) ? date : null;
    }
}

public record HelsedirektoratetContentSource(
    string Title,
    string? SourceUrl,
    DateTimeOffset? SourceUpdatedAt,
    string? Text
);

public class HelsedirektoratetConfigurationException(string message) : Exception(message);

public class HelsedirektoratetRequestException(string message) : Exception(message);
