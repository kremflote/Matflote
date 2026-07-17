using System.Globalization;
using System.Text;

namespace DinnerPlanner.Api.Services;

public static class LookupDuplicateDetector
{
    public static string? FindNearDuplicate(string candidate, IEnumerable<string> existingNames)
    {
        var normalizedCandidate = Normalize(candidate);
        if (normalizedCandidate.Length == 0)
        {
            return null;
        }

        foreach (var existingName in existingNames)
        {
            var normalizedExisting = Normalize(existingName);
            if (normalizedExisting.Length == 0 || normalizedExisting == normalizedCandidate)
            {
                continue;
            }

            if (IsNearDuplicate(normalizedCandidate, normalizedExisting))
            {
                return existingName;
            }
        }

        return null;
    }

    private static bool IsNearDuplicate(string first, string second)
    {
        var lengthDifference = Math.Abs(first.Length - second.Length);
        var longest = Math.Max(first.Length, second.Length);
        if (lengthDifference > SimilarityThreshold(longest))
        {
            return false;
        }

        return DamerauLevenshteinDistance(first, second, SimilarityThreshold(longest)) <= SimilarityThreshold(longest);
    }

    private static int SimilarityThreshold(int length) => length <= 5 ? 1 : 2;

    private static string Normalize(string value)
    {
        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsLetterOrDigit(character))
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static int DamerauLevenshteinDistance(string first, string second, int maxDistance)
    {
        var distances = new int[first.Length + 1, second.Length + 1];

        for (var firstIndex = 0; firstIndex <= first.Length; firstIndex++)
        {
            distances[firstIndex, 0] = firstIndex;
        }

        for (var secondIndex = 0; secondIndex <= second.Length; secondIndex++)
        {
            distances[0, secondIndex] = secondIndex;
        }

        for (var firstIndex = 1; firstIndex <= first.Length; firstIndex++)
        {
            var rowMinimum = int.MaxValue;

            for (var secondIndex = 1; secondIndex <= second.Length; secondIndex++)
            {
                var cost = first[firstIndex - 1] == second[secondIndex - 1] ? 0 : 1;
                var distance = Math.Min(
                    Math.Min(
                        distances[firstIndex - 1, secondIndex] + 1,
                        distances[firstIndex, secondIndex - 1] + 1
                    ),
                    distances[firstIndex - 1, secondIndex - 1] + cost
                );

                if (
                    firstIndex > 1 &&
                    secondIndex > 1 &&
                    first[firstIndex - 1] == second[secondIndex - 2] &&
                    first[firstIndex - 2] == second[secondIndex - 1]
                )
                {
                    distance = Math.Min(distance, distances[firstIndex - 2, secondIndex - 2] + 1);
                }

                distances[firstIndex, secondIndex] = distance;
                rowMinimum = Math.Min(rowMinimum, distance);
            }

            if (rowMinimum > maxDistance)
            {
                return rowMinimum;
            }
        }

        return distances[first.Length, second.Length];
    }
}
