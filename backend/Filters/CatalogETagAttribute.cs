// MATFLOTE: Conditional GET for the catalog lists the browser loads on every page.
// Note: The validator is checked before model binding and before the action runs, so a 304 costs no database work.

using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;

namespace DinnerPlanner.Api.Filters;

[AttributeUsage(AttributeTargets.Method)]
public sealed class CatalogETagAttribute(CatalogGroup group) : Attribute, IAsyncResourceFilter
{
    public CatalogGroup Group { get; } = group;

    public async Task OnResourceExecutionAsync(ResourceExecutingContext context, ResourceExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        if (!HttpMethods.IsGet(request.Method) && !HttpMethods.IsHead(request.Method))
        {
            await next();
            return;
        }

        var catalogVersion = context.HttpContext.RequestServices.GetRequiredService<CatalogVersion>();
        var etag = catalogVersion.GetETag(Group);
        var headers = context.HttpContext.Response.Headers;
        headers.ETag = etag;
        // The browser keeps the body but asks every time; the answer is usually an empty 304.
        headers.CacheControl = "no-cache";

        if (Matches(request.Headers.IfNoneMatch, etag))
        {
            context.Result = new StatusCodeResult(StatusCodes.Status304NotModified);
            return;
        }

        await next();
    }

    private static bool Matches(Microsoft.Extensions.Primitives.StringValues ifNoneMatch, string etag)
    {
        if (ifNoneMatch.Count == 0)
        {
            return false;
        }

        if (!EntityTagHeaderValue.TryParseList(ifNoneMatch, out var candidates))
        {
            return false;
        }

        var current = EntityTagHeaderValue.Parse(etag);
        // If-None-Match uses the weak comparison (RFC 9110 section 13.1.2).
        return candidates.Any(candidate => candidate.Equals(EntityTagHeaderValue.Any) || candidate.Compare(current, useStrongComparison: false));
    }
}
