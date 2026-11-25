using System.Net;
using System.Text;

namespace DinnerPlanner.Api.Tests;

/// <summary>Answers outgoing HTTP requests in tests, so nothing reaches the internet. Records every request.</summary>
public sealed class FakeHttpHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
{
    private readonly List<Uri> requests = [];

    public IReadOnlyList<Uri> Requests
    {
        get
        {
            lock (requests)
            {
                return requests.ToList();
            }
        }
    }

    public static HttpResponseMessage Json(string json) =>
        new(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        lock (requests)
        {
            requests.Add(request.RequestUri!);
        }

        return Task.FromResult(respond(request));
    }
}
