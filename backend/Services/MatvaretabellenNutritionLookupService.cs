using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using Microsoft.Extensions.Caching.Memory;
using System.Globalization;
using System.Text;
using System.Text.Json.Serialization;

namespace DinnerPlanner.Api.Services;

public partial class MatvaretabellenNutritionLookupService(
    HttpClient httpClient,
    IMemoryCache cache,
    ILogger<MatvaretabellenNutritionLookupService> logger
)
{
    private const string CacheKey = "matvaretabellen-foods-nb";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromDays(30);

    public async Task<MatvaretabellenNutritionMatch?> FindBestMatchAsync(
        string productName,
        string? brand,
        string? ingredients,
        ProductLookupNutritionDto? productNutrition,
        CancellationToken cancellationToken
    )
    {
        return (await FindMatchesAsync(productName, brand, ingredients, productNutrition, cancellationToken)).AcceptedMatch;
    }

    public async Task<MatvaretabellenNutritionLookupResult> FindMatchesAsync(
        string productName,
        string? brand,
        string? ingredients,
        ProductLookupNutritionDto? productNutrition,
        CancellationToken cancellationToken
    )
    {
        var searchableProductText = RemoveBrandAndPackageText(productName, brand);
        var queryTokens = Tokenize(searchableProductText).ToHashSet();
        if (queryTokens.Count == 0)
        {
            return new MatvaretabellenNutritionLookupResult(null, []);
        }

        var foods = await GetFoodsAsync(cancellationToken);
        if (IsBreadProduct(searchableProductText, ingredients))
        {
            return FindBestBreadMatch(foods, queryTokens, productNutrition);
        }

        var candidates = foods
            .Select(food => new
            {
                Food = food,
                Score = ScoreFood(queryTokens, food)
            })
            .Where(match => match.Score > 0m)
            .OrderByDescending(match => match.Score)
            .ThenBy(match => match.Food.FoodName)
            .Take(8)
            .Select(match => ToMatch(match.Food, match.Score))
            .ToList();

        var bestMatch = candidates.FirstOrDefault(match => match.Confidence >= 0.52m);
        return new MatvaretabellenNutritionLookupResult(bestMatch, candidates);
    }

    private static MatvaretabellenNutritionMatch ToMatch(MatvaretabellenFood food, decimal confidence)
    {
        return new MatvaretabellenNutritionMatch(
            food.FoodId,
            food.FoodName,
            confidence,
            ToNutrition(food),
            ToAbsoluteMatvaretabellenUrl(food.Uri)
        );
    }

    private static MatvaretabellenNutritionLookupResult FindBestBreadMatch(
        IReadOnlyCollection<MatvaretabellenFood> foods,
        HashSet<string> queryTokens,
        ProductLookupNutritionDto? productNutrition
    )
    {
        var candidates = foods
            .Where(IsBreadFood)
            .Select(food =>
            {
                var nutrition = ToNutrition(food);
                var textScore = ScoreFood(queryTokens, food);
                var macroScore = ScoreMacroSimilarity(productNutrition, nutrition);
                var score = macroScore is null
                    ? textScore
                    : textScore * 0.35m + macroScore.Value * 0.65m;

                return new
                {
                    Food = food,
                    Nutrition = nutrition,
                    TextScore = textScore,
                    MacroScore = macroScore,
                    Score = score
                };
            })
            .Where(match => match.Score > 0m && match.TextScore >= 0.10m)
            .OrderByDescending(match => match.Score)
            .ThenByDescending(match => match.MacroScore ?? 0m)
            .ThenBy(match => match.Food.FoodName)
            .Take(8)
            .Select(match => new MatvaretabellenNutritionMatch(
                match.Food.FoodId,
                match.Food.FoodName,
                match.Score,
                match.Nutrition,
                ToAbsoluteMatvaretabellenUrl(match.Food.Uri)
            ))
            .ToList();

        var bestMatch = candidates.FirstOrDefault(match => match.Confidence >= 0.50m);
        return new MatvaretabellenNutritionLookupResult(bestMatch, candidates);
    }

    private async Task<IReadOnlyCollection<MatvaretabellenFood>> GetFoodsAsync(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(CacheKey, out IReadOnlyCollection<MatvaretabellenFood>? cachedFoods) && cachedFoods is not null)
        {
            return cachedFoods;
        }

        try
        {
            httpClient.BaseAddress ??= new Uri("https://www.matvaretabellen.no/");
            var response = await httpClient.GetFromJsonAsync<MatvaretabellenFoodsResponse>(
                "api/nb/foods.json",
                cancellationToken
            );
            var foods = response?.Foods ?? [];
            cache.Set(CacheKey, foods, CacheDuration);
            return foods;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Could not load Matvaretabellen foods.");
            return [];
        }
    }

    private static decimal ScoreFood(HashSet<string> queryTokens, MatvaretabellenFood food)
    {
        var foodTokens = Tokenize($"{food.FoodName} {string.Join(" ", food.SearchKeywords ?? [])}").ToHashSet();
        if (foodTokens.Count == 0)
        {
            return 0m;
        }

        var matches = queryTokens.Count(foodTokens.Contains);
        var coverage = (decimal)matches / queryTokens.Count;
        var precision = (decimal)matches / foodTokens.Count;
        var exactBonus = Normalize(food.FoodName).Contains(string.Join(" ", queryTokens), StringComparison.Ordinal)
            ? 0.12m
            : 0m;

        return Math.Min(1m, coverage * 0.72m + precision * 0.28m + exactBonus);
    }

    private static ProductLookupNutritionDto ToNutrition(MatvaretabellenFood food)
    {
        var constituents = food.Constituents ?? [];

        return new ProductLookupNutritionDto(
            food.Calories?.Quantity,
            FindNutrient(constituents, "Karbo"),
            FindNutrient(constituents, "Protein"),
            FindNutrient(constituents, "NaCl"),
            FindNutrient(constituents, "Fiber"),
            FindNutrient(constituents, "Mettet"),
            FindNutrient(constituents, "Trans"),
            FindNutrient(constituents, "Enumet"),
            FindNutrient(constituents, "Flerum"),
            FindNutrient(constituents, "Omega-3"),
            FindNutrient(constituents, "Omega-6"),
            FindNutrient(constituents, "Kolest"),
            FindNutrient(constituents, "Vit A"),
            FindNutrient(constituents, "Folat"),
            FindNutrient(constituents, "Vit B12"),
            FindNutrient(constituents, "Vit C"),
            FindNutrient(constituents, "Vit D"),
            FindNutrient(constituents, "Vit E"),
            FindNutrient(constituents, "VITK") ?? FindNutrient(constituents, "VITK1"),
            FindNutrient(constituents, "CHOLN")
        );
    }

    private static decimal? ScoreMacroSimilarity(ProductLookupNutritionDto? source, ProductLookupNutritionDto target)
    {
        if (source is null)
        {
            return null;
        }

        var weightedScores = new List<(decimal Score, decimal Weight)>
        {
            NutrientSimilarity(source.Calories, target.Calories, 90m, 0.14m),
            NutrientSimilarity(source.CarbohydrateGrams, target.CarbohydrateGrams, 22m, 0.20m),
            NutrientSimilarity(source.ProteinGrams, target.ProteinGrams, 10m, 0.16m),
            NutrientSimilarity(source.DietaryFiberGrams, target.DietaryFiberGrams, 8m, 0.30m),
            NutrientSimilarity(source.SaltGrams, target.SaltGrams, 1.1m, 0.10m),
            NutrientSimilarity(source.SaturatedFatGrams, target.SaturatedFatGrams, 3m, 0.10m)
        }
            .Where(score => score.Score >= 0m && score.Weight > 0m)
            .ToList();

        if (weightedScores.Count == 0)
        {
            return null;
        }

        var totalWeight = weightedScores.Sum(score => score.Weight);
        return weightedScores.Sum(score => score.Score * score.Weight) / totalWeight;
    }

    private static (decimal Score, decimal Weight) NutrientSimilarity(
        decimal? source,
        decimal? target,
        decimal tolerance,
        decimal weight
    )
    {
        if (source is null || target is null)
        {
            return (-1m, 0m);
        }

        var difference = Math.Abs(source.Value - target.Value);
        return (Math.Max(0m, 1m - difference / tolerance), weight);
    }

    private static decimal? FindNutrient(IReadOnlyCollection<MatvaretabellenConstituent> constituents, string nutrientId) =>
        constituents.FirstOrDefault(constituent =>
            string.Equals(constituent.NutrientId, nutrientId, StringComparison.OrdinalIgnoreCase))?.Quantity;

    private static string RemoveBrandAndPackageText(string value, string? brand)
    {
        var withoutBrand = string.IsNullOrWhiteSpace(brand)
            ? value
            : value.Replace(brand, "", StringComparison.OrdinalIgnoreCase);

        return PackageTextRegex().Replace(withoutBrand, " ");
    }

    private static IEnumerable<string> Tokenize(string value) =>
        ExpandNorwegianFoodCompounds(Normalize(value))
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(token => token.Length >= 3 && !StopWords.Contains(token));

    private static string Normalize(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var character in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(character);
            if (category == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            builder.Append(character switch
            {
                'æ' or 'Æ' => "ae",
                'ø' or 'Ø' => "o",
                'å' or 'Å' => "a",
                _ => char.IsLetterOrDigit(character) ? char.ToLowerInvariant(character).ToString() : " "
            });
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static bool IsBreadProduct(string productName, string? ingredients)
    {
        var normalized = Normalize($"{productName} {ingredients}");
        return BreadTerms.Any(term => normalized.Contains(term, StringComparison.Ordinal));
    }

    private static bool IsBreadFood(MatvaretabellenFood food)
    {
        var normalized = Normalize($"{food.FoodName} {string.Join(" ", food.SearchKeywords ?? [])}");
        return BreadTerms.Any(term => normalized.Contains(term, StringComparison.Ordinal));
    }

    private static string ExpandNorwegianFoodCompounds(string value)
    {
        return value
            .Replace("grovbrod", "grovbrod grov brod", StringComparison.Ordinal)
            .Replace("fullkornsbrod", "fullkornsbrod fullkorn brod", StringComparison.Ordinal)
            .Replace("rugbrod", "rugbrod rug brod", StringComparison.Ordinal)
            .Replace("knekkebrod", "knekkebrod knekk brod", StringComparison.Ordinal)
            .Replace("flatbrod", "flatbrod flat brod", StringComparison.Ordinal);
    }

    private static string? ToAbsoluteMatvaretabellenUrl(string? uri)
    {
        if (string.IsNullOrWhiteSpace(uri))
        {
            return null;
        }

        return Uri.TryCreate(uri, UriKind.Absolute, out var absoluteUri)
            ? absoluteUri.ToString()
            : $"https://www.matvaretabellen.no/{uri.TrimStart('/')}";
    }

    [System.Text.RegularExpressions.GeneratedRegex(@"\b\d+([,.]\d+)?\s?(g|kg|ml|l|stk|pk|pakke|pack)\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase)]
    private static partial System.Text.RegularExpressions.Regex PackageTextRegex();

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "med",
        "uten",
        "fra",
        "til",
        "the",
        "and",
        "extra",
        "original",
        "naturell",
        "økologisk",
        "okologisk"
    };

    private static readonly string[] BreadTerms =
    [
        "brod",
        "grovbrod",
        "kneipp",
        "rugbrod",
        "knekkebrod",
        "loff",
        "baguette",
        "rundstykke",
        "fullkorn"
    ];
}

public record MatvaretabellenNutritionMatch(
    string FoodId,
    string FoodName,
    decimal Confidence,
    ProductLookupNutritionDto Nutrition,
    string? Url
);

public record MatvaretabellenNutritionLookupResult(
    MatvaretabellenNutritionMatch? AcceptedMatch,
    IReadOnlyCollection<MatvaretabellenNutritionMatch> Candidates
);

public record MatvaretabellenFoodsResponse(
    [property: JsonPropertyName("foods")]
    IReadOnlyCollection<MatvaretabellenFood> Foods
);

public record MatvaretabellenFood(
    [property: JsonPropertyName("foodId")]
    string FoodId,
    [property: JsonPropertyName("foodName")]
    string FoodName,
    [property: JsonPropertyName("uri")]
    string? Uri,
    [property: JsonPropertyName("searchKeywords")]
    IReadOnlyCollection<string>? SearchKeywords,
    [property: JsonPropertyName("calories")]
    MatvaretabellenNutrientValue? Calories,
    [property: JsonPropertyName("constituents")]
    IReadOnlyCollection<MatvaretabellenConstituent>? Constituents
);

public record MatvaretabellenNutrientValue(
    [property: JsonPropertyName("quantity")]
    decimal? Quantity,
    [property: JsonPropertyName("unit")]
    string? Unit
);

public record MatvaretabellenConstituent(
    [property: JsonPropertyName("nutrientId")]
    string NutrientId,
    [property: JsonPropertyName("quantity")]
    decimal? Quantity,
    [property: JsonPropertyName("unit")]
    string? Unit
);
