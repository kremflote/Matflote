using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/product-lookup")]
public partial class ProductLookupController(
    KassalappProductLookupService kassalappProductLookup,
    MatvaretabellenNutritionLookupService matvaretabellenNutritionLookup
) : ControllerBase
{
    [HttpGet("ean/{ean}")]
    public async Task<ActionResult<ProductLookupResponseDto>> LookupByEan(
        string ean,
        CancellationToken cancellationToken
    )
    {
        if (!ValidEanRegex().IsMatch(ean))
        {
            return BadRequest("EAN must be 8 or 13 digits.");
        }

        try
        {
            return Ok(await kassalappProductLookup.LookupByEanAsync(ean, cancellationToken));
        }
        catch (ProductLookupConfigurationException exception)
        {
            return BadRequest(exception.Message);
        }
        catch (ProductLookupRateLimitException exception)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, exception.Message);
        }
        catch (HttpRequestException exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, exception.Message);
        }
    }

    [HttpGet("matvaretabellen")]
    public async Task<ActionResult<IReadOnlyCollection<MatvaretabellenCandidateDto>>> SearchMatvaretabellen(
        [FromQuery] string query,
        CancellationToken cancellationToken
    )
    {
        var trimmedQuery = query.Trim();
        if (string.IsNullOrWhiteSpace(trimmedQuery))
        {
            return BadRequest("Search query is required.");
        }

        if (trimmedQuery.Length > 120)
        {
            return BadRequest("Search query can be at most 120 characters.");
        }

        try
        {
            var result = await matvaretabellenNutritionLookup.FindMatchesAsync(
                trimmedQuery,
                brand: null,
                ingredients: null,
                productNutrition: null,
                cancellationToken
            );

            return Ok(result.Candidates.Select(ToCandidateDto).ToList());
        }
        catch (HttpRequestException exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, exception.Message);
        }
    }

    private static MatvaretabellenCandidateDto ToCandidateDto(MatvaretabellenNutritionMatch candidate)
    {
        return new MatvaretabellenCandidateDto(
            candidate.FoodId,
            candidate.FoodName,
            candidate.Url,
            candidate.Confidence,
            candidate.Nutrition
        );
    }

    [GeneratedRegex("^(\\d{8}|\\d{13})$")]
    private static partial Regex ValidEanRegex();
}
