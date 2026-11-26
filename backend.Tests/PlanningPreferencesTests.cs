using System.Net;
using System.Text.Json;
using DinnerPlanner.Api.Dtos;

namespace DinnerPlanner.Api.Tests;

public class PlanningPreferencesTests(MatfloteFactory factory) : IClassFixture<MatfloteFactory>
{
    private const string Url = "/api/app-settings/planning-preferences";

    private readonly HttpClient client = factory.CreateClient();

    private static object Body(
        int peopleEating = 2,
        int fish = 2,
        int chicken = 1,
        string[]? avoidTags = null,
        string[]? avoidIngredients = null,
        int repeatAfterWeeks = 3,
        string? notes = null) => new
    {
        peopleEating,
        minFishDinnersPerWeek = fish,
        minChickenDinnersPerWeek = chicken,
        avoidTags = avoidTags ?? [],
        avoidIngredients = avoidIngredients ?? [],
        repeatAfterWeeks,
        notes,
    };

    [Fact]
    public async Task A_new_database_has_the_planners_old_minimums()
    {
        using var fresh = new MatfloteFactory();
        var defaults = await fresh.CreateClient().GetJson<PlanningPreferencesDto>(Url);
        Assert.Equal(1, defaults.PeopleEating);
        Assert.Equal(1, defaults.MinFishDinnersPerWeek);
        Assert.Equal(2, defaults.MinChickenDinnersPerWeek);
        Assert.Equal(3, defaults.RepeatAfterWeeks);
        Assert.Empty(defaults.AvoidTags);
        Assert.Null(defaults.Notes);
    }

    [Fact]
    public async Task Preferences_are_saved_read_back_and_shown_in_the_assistant_context()
    {
        // Names are matched like the assistant API matches them and stored as the catalog spells them.
        var response = await client.PutJson(Url, Body(peopleEating: 3, avoidTags: ["lamb", "LAMB"], avoidIngredients: ["garlic"], notes: "  No spicy food on weekdays.  "));
        await response.EnsureStatus(HttpStatusCode.OK);
        var saved = await response.Read<PlanningPreferencesDto>();
        Assert.Equal(3, saved.PeopleEating);
        Assert.Equal(2, saved.MinFishDinnersPerWeek);
        Assert.Equal(["Lamb"], saved.AvoidTags);
        Assert.Equal(["Garlic"], saved.AvoidIngredients);
        Assert.Equal("No spicy food on weekdays.", saved.Notes);

        var context = await client.Context();
        var fromContext = context.GetProperty("planningPreferences");
        Assert.Equal(3, fromContext.GetProperty("peopleEating").GetInt32());
        Assert.Equal(2, fromContext.GetProperty("minFishDinnersPerWeek").GetInt32());
        Assert.Equal(["Lamb"], fromContext.Strings("avoidTags"));
    }

    [Fact]
    public async Task People_eating_is_the_same_setting_as_on_the_nutrition_page()
    {
        await (await client.PutJson(Url, Body(peopleEating: 4))).EnsureStatus(HttpStatusCode.OK);
        var nutrition = await client.GetJson<JsonElement>("/api/nutrition/profile-preference");
        Assert.Equal(4, nutrition.GetProperty("peopleEating").GetInt32());

        await (await client.PutJson("/api/nutrition/profile-preference", new { profileId = (string?)null, peopleEating = 5 })).EnsureStatus(HttpStatusCode.OK);
        Assert.Equal(5, (await client.GetJson<PlanningPreferencesDto>(Url)).PeopleEating);
    }

    public static TheoryData<string, object, string> InvalidPreferences() => new()
    {
        { "no people", Body(peopleEating: 0), "peopleEating must be between 1 and 20" },
        { "negative minimum", Body(fish: -1), "between 0 and 7" },
        { "minimums over a week", Body(fish: 4, chicken: 4), "cannot be more than 7" },
        { "repeat too long", Body(repeatAfterWeeks: 13), "repeatAfterWeeks must be between 0 and 12" },
        { "unknown tag", Body(avoidTags: ["Nope tag"]), "Unknown tags: Nope tag" },
        { "unknown ingredient", Body(avoidIngredients: ["Nope ingredient"]), "Unknown ingredients: Nope ingredient" },
        { "notes too long", Body(notes: new string('n', 1001)), "at most 1000 characters" },
    };

    [Theory]
    [MemberData(nameof(InvalidPreferences))]
    public async Task Invalid_preferences_are_rejected_and_nothing_changes(string scenario, object body, string expectedError)
    {
        var before = await client.GetStringAsync(Url);

        var response = await client.PutJson(Url, body);

        await response.EnsureStatus(HttpStatusCode.BadRequest);
        var message = await response.Content.ReadAsStringAsync();
        Assert.True(message.Contains(expectedError, StringComparison.Ordinal), $"{scenario}: {message}");
        Assert.Equal(before, await client.GetStringAsync(Url));
    }
}
