namespace DinnerPlanner.Api.Dtos;

/// <summary>
/// What a controller returns for a rejected request: the message, the list of problems when there are several, and
/// any further fields a client needs (the uses of an ingredient that cannot be deleted, for example).
/// <see cref="Filters.ProblemDetailsResultFilter"/> sends it as ProblemDetails with <c>error</c> and <c>details</c> kept
/// as fields, so readers of the earlier <c>{ "error", "details" }</c> body keep working.
/// </summary>
public sealed record ApiError(string Error, IReadOnlyCollection<string>? Details = null)
{
    /// <summary>Further top-level fields of the response.</summary>
    public IReadOnlyDictionary<string, object?>? Extensions { get; init; }

    /// <summary>One message for a list of problems: the problem itself when there is one, otherwise a count and the list.</summary>
    public static ApiError From(IReadOnlyCollection<string> problems) =>
        problems.Count == 1
            ? new ApiError(problems.First(), problems)
            : new ApiError($"{problems.Count} problems: {string.Join(" ", problems)}", problems);
}
