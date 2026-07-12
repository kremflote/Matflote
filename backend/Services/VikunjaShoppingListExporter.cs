using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Services;

public class VikunjaShoppingListExporter(
    HttpClient httpClient,
    AppSettingsService appSettingsService,
    VikunjaOptionsResolver optionsResolver
) : IShoppingListExporter
{
    public string ProviderName => "Vikunja";

    public async Task<ShoppingListExportResultDto> ExportAsync(GroceryListDto groceryList, CancellationToken cancellationToken)
    {
        var options = await optionsResolver.ResolveSavedAsync(cancellationToken);
        var taskMode = await appSettingsService.GetValueAsync(AppSettingKeys.ExportTaskMode, cancellationToken);

        if (string.Equals(taskMode, ExportTaskModes.SeparateTasks, StringComparison.OrdinalIgnoreCase))
        {
            return await ExportSeparateTasksAsync(groceryList, options, cancellationToken);
        }

        var taskTitle = $"MATFLOTE shopping list: {groceryList.From:yyyy-MM-dd} - {groceryList.To:yyyy-MM-dd}";
        var taskDescription = BuildTaskDescription(groceryList);
        var taskId = await CreateTaskAsync(options, taskTitle, taskDescription, cancellationToken);

        return new ShoppingListExportResultDto(
            ProviderName,
            taskId,
            new Uri(options.BaseUri, $"projects/{options.ProjectId}").ToString(),
            "Shopping list exported to Vikunja."
        );
    }

    public async Task<TestConnectionResultDto> TestConnectionAsync(
        UpdateShoppingListExportSettingsRequest request,
        CancellationToken cancellationToken
    )
    {
        var options = await optionsResolver.ResolveForTestAsync(request, cancellationToken);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, new Uri(options.BaseUri, $"api/v1/projects/{options.ProjectId}"));
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiToken);

        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Vikunja connection test failed with status {(int)response.StatusCode}: {TrimResponse(responseBody)}",
                null,
                response.StatusCode);
        }

        return new TestConnectionResultDto(ProviderName, true, "Vikunja connection succeeded.");
    }

    private async Task<ShoppingListExportResultDto> ExportSeparateTasksAsync(
        GroceryListDto groceryList,
        VikunjaOptions options,
        CancellationToken cancellationToken
    )
    {
        var taskIds = new List<string>();

        foreach (var section in groceryList.Sections)
        {
            foreach (var item in section.Items)
            {
                var title = BuildItemTaskTitle(item);
                var description = BuildItemTaskDescription(groceryList, section.Name, item);
                taskIds.Add(await CreateTaskAsync(options, title, description, cancellationToken));
            }
        }

        return new ShoppingListExportResultDto(
            ProviderName,
            string.Join(",", taskIds),
            new Uri(options.BaseUri, $"projects/{options.ProjectId}").ToString(),
            "Shopping list exported to Vikunja."
        );
    }

    private async Task<string> CreateTaskAsync(
        VikunjaOptions options,
        string title,
        string description,
        CancellationToken cancellationToken
    )
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, new Uri(options.BaseUri, $"api/v1/projects/{options.ProjectId}/tasks"))
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new Dictionary<string, object?>
                {
                    ["title"] = title,
                    ["description"] = description
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

        return GetTaskId(responseBody);
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

    private static string BuildItemTaskDescription(GroceryListDto groceryList, string sectionName, GroceryListItemDto item)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Generated from MATFLOTE planner.");
        builder.AppendLine();
        builder.AppendLine($"Range: {groceryList.From:yyyy-MM-dd} - {groceryList.To:yyyy-MM-dd}");
        builder.AppendLine($"Section: {sectionName}");

        if (item.SourceRecipes.Count > 0)
        {
            builder.AppendLine($"Recipes: {string.Join(", ", item.SourceRecipes)}");
        }

        return builder.ToString();
    }

    private static string BuildItemTaskTitle(GroceryListItemDto item)
    {
        var title = $"{CultureInfo.InvariantCulture.TextInfo.ToTitleCase(item.IngredientName)} - {FormatTitleAmount(item.DisplayAmount)}";

        return item.SourceRecipes.Count == 0
            ? title
            : $"{title} - ({string.Join(", ", item.SourceRecipes)})";
    }

    private static string FormatTitleAmount(string displayAmount) =>
        displayAmount
            .Replace(" g", "g", StringComparison.Ordinal)
            .Replace(" kg", "kg", StringComparison.Ordinal)
            .Replace(" ml", "ml", StringComparison.Ordinal)
            .Replace(" l", "l", StringComparison.Ordinal);

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
}
