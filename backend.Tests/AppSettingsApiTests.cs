using System.Net;
using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Tests;

public class AppSettingsApiTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Defaults_come_from_configuration_and_saved_values_win()
    {
        var defaults = await client.GetJson<AppSettingsDto>("/api/app-settings");
        Assert.Equal("Vikunja", defaults.ShoppingListExport.Provider);
        Assert.Equal("https://kassal.app/api/v1", defaults.ExternalIntegrations.Kassalapp.BaseUrl);
        Assert.Equal(["Spice"], defaults.ShoppingListExport.DefaultExcludedIngredientTags);
        Assert.False(defaults.ShoppingListExport.Vikunja.HasApiToken);

        var update = await client.PutJson("/api/app-settings", new
        {
            shoppingListExport = new
            {
                provider = "Vikunja",
                taskMode = defaults.ShoppingListExport.TaskMode,
                vikunja = new { baseUrl = "https://vikunja.example", projectId = 7, apiToken = "secret" },
            },
            externalIntegrations = new
            {
                kassalapp = new { baseUrl = "https://kassal.example/api/v1", apiKey = (string?)null },
                helsedirektoratet = new { baseUrl = "https://hdir.example", subscriptionKey = "key" },
            },
        });
        await update.EnsureStatus(HttpStatusCode.OK);
        await (await client.PutJson("/api/app-settings/grocery-export-rules", new { defaultExcludedIngredientTags = new[] { "Herb", "Spice" } }))
            .EnsureStatus(HttpStatusCode.OK);

        var saved = await client.GetJson<AppSettingsDto>("/api/app-settings");
        Assert.Equal("https://vikunja.example", saved.ShoppingListExport.Vikunja.BaseUrl);
        Assert.Equal(7, saved.ShoppingListExport.Vikunja.ProjectId);
        Assert.True(saved.ShoppingListExport.Vikunja.HasApiToken);
        Assert.Equal("https://kassal.example/api/v1", saved.ExternalIntegrations.Kassalapp.BaseUrl);
        Assert.False(saved.ExternalIntegrations.Kassalapp.HasApiKey);
        Assert.Equal("https://hdir.example", saved.ExternalIntegrations.Helsedirektoratet.BaseUrl);
        Assert.True(saved.ExternalIntegrations.Helsedirektoratet.HasSubscriptionKey);
        Assert.Equal(["Herb", "Spice"], saved.ShoppingListExport.DefaultExcludedIngredientTags.Order());
    }
}
