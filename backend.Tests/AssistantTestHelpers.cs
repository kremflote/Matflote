using System.Net;
using System.Text.Json;

namespace DinnerPlanner.Api.Tests;

public static class AssistantTestHelpers
{
    public static async Task<JsonElement> Import(this HttpClient client, object body, HttpStatusCode expected = HttpStatusCode.OK)
    {
        var response = await client.PostJson("/api/assistant/recipes", body);
        await response.EnsureStatus(expected);
        return await response.ReadJson();
    }

    public static async Task<JsonElement> PlanMeals(this HttpClient client, object body, HttpStatusCode expected = HttpStatusCode.OK)
    {
        var response = await client.PutJson("/api/assistant/meal-plan", body);
        await response.EnsureStatus(expected);
        return await response.ReadJson();
    }

    public static Task<JsonElement> Context(this HttpClient client) =>
        client.GetJson<JsonElement>("/api/assistant/context");

    public static Task<JsonElement> MealPlan(this HttpClient client, DateOnly from, DateOnly to) =>
        client.GetJson<JsonElement>($"/api/assistant/meal-plan?from={from:yyyy-MM-dd}&to={to:yyyy-MM-dd}");

    public static JsonElement Item(this JsonElement result, string list, string name) =>
        result.GetProperty(list).EnumerateArray().Single(item => item.GetProperty("name").GetString() == name);

    public static string Status(this JsonElement item) => item.GetProperty("status").GetString()!;

    public static string[] Strings(this JsonElement element, string property) =>
        element.GetProperty(property).EnumerateArray().Select(value => value.GetString()!).ToArray();

    public static string AllErrors(this JsonElement result)
    {
        var messages = new List<string>();
        foreach (var property in result.EnumerateObject())
        {
            if (property.Name == "errors")
            {
                messages.AddRange(property.Value.EnumerateArray().Select(value => value.GetString()!));
            }
            else if (property.Value.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in property.Value.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.Object))
                {
                    messages.AddRange(item.Strings("errors"));
                }
            }
        }

        return string.Join("\n", messages);
    }

    public static JsonElement? FindRecipe(this JsonElement context, string name)
    {
        foreach (var recipe in context.GetProperty("recipes").EnumerateArray())
        {
            if (recipe.GetProperty("name").GetString() == name)
            {
                return recipe;
            }
        }

        return null;
    }

    public static JsonElement? FindIngredient(this JsonElement context, string name)
    {
        foreach (var ingredient in context.GetProperty("ingredients").EnumerateArray())
        {
            if (ingredient.GetProperty("name").GetString() == name)
            {
                return ingredient;
            }
        }

        return null;
    }
}
