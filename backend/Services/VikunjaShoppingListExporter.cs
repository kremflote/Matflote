using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Services;

public class VikunjaShoppingListExporter(
    HttpClient httpClient,
    IConfiguration configuration
) : IShoppingListExporter
{
    public string ProviderName => "Vikunja";

    public async Task<ShoppingListExportResultDto> ExportAsync(GroceryListDto groceryList, CancellationToken cancellationToken)
    {
        var options = GetOptions();
        var taskTitle = $"MATFLOTE shopping list: {groceryList.From:yyyy-MM-dd} - {groceryList.To:yyyy-MM-dd}";
        var taskDescription = BuildTaskDescription(groceryList);
        using var request = new HttpRequestMessage(HttpMethod.Put, new Uri(options.BaseUri, $"api/v1/projects/{options.ProjectId}/tasks"))
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new Dictionary<string, object?>
                {
                    ["title"] = taskTitle,
                    ["description"] = taskDescription
                }),
                Encoding.UTF8,
                "application/json"
            )
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiToken);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Vikunja export failed with status {(int)response.StatusCode}: {TrimResponse(responseBody)}",
                null,
                response.StatusCode);
        }

        var taskId = GetTaskId(responseBody);

        return new ShoppingListExportResultDto(
            ProviderName,
            taskId,
            new Uri(options.BaseUri, $"projects/{options.ProjectId}").ToString(),
            "Shopping list exported to Vikunja."
        );
    }

    private VikunjaOptions GetOptions()
    {
        var baseUrl = configuration["Vikunja:BaseUrl"];
        var apiToken = configuration["Vikunja:ApiToken"];
        var projectIdValue = configuration["Vikunja:ProjectId"];

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new ShoppingListExportConfigurationException("Vikunja base URL is not configured.");
        }

        if (!Uri.TryCreate($"{baseUrl.TrimEnd('/')}/", UriKind.Absolute, out var baseUri))
        {
            throw new ShoppingListExportConfigurationException("Vikunja base URL must be an absolute URL.");
        }

        if (string.IsNullOrWhiteSpace(apiToken))
        {
            throw new ShoppingListExportConfigurationException("Vikunja API token is not configured.");
        }

        if (!int.TryParse(projectIdValue, out var projectId) || projectId <= 0)
        {
            throw new ShoppingListExportConfigurationException("Vikunja project ID must be a positive number.");
        }

        return new VikunjaOptions(baseUri, apiToken, projectId);
    }

    private static string BuildTaskDescription(GroceryListDto groceryList)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Generated from MATFLOTE planner.");
        builder.AppendLine();
        builder.AppendLine($"Range: {groceryList.From:yyyy-MM-dd} - {groceryList.To:yyyy-MM-dd}");
        builder.AppendLine();

        if (groceryList.Sections.Count == 0)
        {
            builder.AppendLine("_No planned ingredients found for this range._");
            return builder.ToString();
        }

        foreach (var section in groceryList.Sections)
        {
            builder.AppendLine($"## {section.Name}");

            foreach (var item in section.Items)
            {
                builder.Append("- [ ] ");
                builder.Append(CultureInfo.InvariantCulture.TextInfo.ToTitleCase(item.IngredientName));
                builder.Append(" - ");
                builder.Append(item.DisplayAmount);

                if (item.SourceRecipes.Count > 0)
                {
                    builder.Append(" (");
                    builder.Append(string.Join(", ", item.SourceRecipes));
                    builder.Append(')');
                }

                builder.AppendLine();
            }

            builder.AppendLine();
        }

        return builder.ToString();
    }

    private static string GetTaskId(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return string.Empty;
        }

        using var document = JsonDocument.Parse(responseBody);

        return document.RootElement.TryGetProperty("id", out var idProperty)
            ? idProperty.ToString()
            : string.Empty;
    }

    private static string TrimResponse(string responseBody)
    {
        const int maxLength = 500;

        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return "empty response";
        }

        return responseBody.Length <= maxLength
            ? responseBody
            : $"{responseBody[..maxLength]}...";
    }

    private record VikunjaOptions(
        Uri BaseUri,
        string ApiToken,
        int ProjectId
    );
}
