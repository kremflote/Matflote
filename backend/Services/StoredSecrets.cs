namespace DinnerPlanner.Api.Services;

/// <summary>
/// When a stored API token may stand in for one missing from a request (AUDIT S2). A "test connection" call
/// names its own base URL; the stored token is sent only to the stored base URL, so a request cannot make the
/// server hand the token to another host.
/// </summary>
public static class StoredSecrets
{
    public static bool MayUseFor(string? requestedBaseUrl, string? storedBaseUrl)
    {
        var requested = Normalize(requestedBaseUrl);
        var stored = Normalize(storedBaseUrl);
        return requested is not null && stored is not null && requested == stored;
    }

    // Trailing slashes and the letter case of scheme and host do not make a different server.
    private static Uri? Normalize(string? baseUrl) =>
        !string.IsNullOrWhiteSpace(baseUrl)
            && Uri.TryCreate($"{baseUrl.Trim().TrimEnd('/')}/", UriKind.Absolute, out var uri)
                ? uri
                : null;
}
