// MATFLOTE: The JSON body of a rejected request.
// Note: The web app shows Error; Details lists each problem when there are several.

namespace DinnerPlanner.Api.Dtos;

public record ApiErrorDto(string Error, IReadOnlyCollection<string>? Details = null)
{
    /// <summary>One message for a list of problems: the problem itself when there is one, otherwise a count and the list.</summary>
    public static ApiErrorDto From(IReadOnlyCollection<string> problems) =>
        problems.Count == 1
            ? new ApiErrorDto(problems.First(), problems)
            : new ApiErrorDto($"{problems.Count} problems: {string.Join(" ", problems)}", problems);
}
