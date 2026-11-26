using DinnerPlanner.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Infrastructure;

namespace DinnerPlanner.Api.Filters;

/// <summary>
/// Sends every error a controller returns as ProblemDetails (AUDIT C2): a plain message (<c>BadRequest("...")</c>) or an
/// <see cref="ApiError"/> becomes <c>application/problem+json</c> with the message in <c>detail</c>. Results that are
/// documented response bodies of their own (the assistant API's 422, 404 and 409 results) are left as they are.
/// </summary>
public sealed class ProblemDetailsResultFilter(ProblemDetailsFactory problemDetailsFactory) : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is not ObjectResult { StatusCode: >= 400 } result)
        {
            return;
        }

        var error = result.Value switch
        {
            string message => new ApiError(message),
            ApiError apiError => apiError,
            _ => null,
        };
        if (error is null)
        {
            return;
        }

        var problem = problemDetailsFactory.CreateProblemDetails(context.HttpContext, result.StatusCode.Value, detail: error.Error);
        if (error.Details is not null)
        {
            problem.Extensions[ProblemDetailsFields.Details] = error.Details;
        }

        foreach (var (key, value) in error.Extensions ?? new Dictionary<string, object?>())
        {
            problem.Extensions[key] = value;
        }

        context.Result = new ObjectResult(problem)
        {
            StatusCode = result.StatusCode,
            ContentTypes = { "application/problem+json" },
        };
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
    }
}

/// <summary>The fields MATFLOTE adds to every ProblemDetails body.</summary>
public static class ProblemDetailsFields
{
    /// <summary>The message to show: the same as <c>detail</c>, or <c>title</c> when there is no detail.</summary>
    public const string Error = "error";

    /// <summary>Each problem, when a request had several.</summary>
    public const string Details = "details";

    /// <summary>Adds <c>error</c>, which the web app and earlier clients read, to a ProblemDetails body.</summary>
    public static void AddError(ProblemDetails problem)
    {
        if (!problem.Extensions.ContainsKey(Error))
        {
            problem.Extensions[Error] = problem.Detail ?? problem.Title;
        }
    }
}
