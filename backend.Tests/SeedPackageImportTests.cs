using System.IO.Compression;
using System.Net;
using System.Text;
using DinnerPlanner.Api.Dtos;
using static DinnerPlanner.Api.Tests.TestData;

namespace DinnerPlanner.Api.Tests;

/// <summary>AUDIT B3: importing a package is additive unless the caller asks for tags to be synchronised.</summary>
public class SeedPackageImportTests
{
    // Names one category with one tag, so a synchronising import would delete every other tag.
    private const string CatalogJson = """
        {
          "tagCategories": [
            { "name": "Produce", "tags": [ { "name": "Vegetable" } ] }
          ],
          "ingredients": [
            { "ingredientName": "SP imported leek", "tags": [ "Vegetable" ] }
          ]
        }
        """;

    private static MultipartFormDataContent Package()
    {
        var zip = new MemoryStream();
        using (var archive = new ZipArchive(zip, ZipArchiveMode.Create, leaveOpen: true))
        {
            using var writer = new StreamWriter(archive.CreateEntry("seed-catalog.json").Open(), Encoding.UTF8);
            writer.Write(CatalogJson);
        }

        var file = new ByteArrayContent(zip.ToArray());
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/zip");
        return new MultipartFormDataContent { { file, "file", "package.zip" } };
    }

    private static async Task<List<string>> TagNames(HttpClient client) =>
        (await client.GetJson<List<IngredientTagCategoryDto>>("/api/ingredient-tag-categories"))
            .SelectMany(category => category.Tags)
            .Select(tag => tag.Name)
            .ToList();

    [Fact]
    public async Task By_default_an_import_adds_and_keeps_every_existing_tag()
    {
        using var factory = new MatfloteFactory();
        var client = factory.CreateClient();
        var rice = await CreateIngredient(client, "SP rice", "Grain");
        var before = await TagNames(client);

        var response = await client.PostAsync("/api/seed-catalog/import-package", Package());

        await response.EnsureStatus(HttpStatusCode.NoContent);
        Assert.Equal(before.Order(), (await TagNames(client)).Order());
        Assert.Equal(["Grain"], (await client.GetJson<IngredientDto>($"/api/ingredients/{rice.IngredientId}")).Tags);
        Assert.Contains(await client.GetJson<List<IngredientDto>>("/api/ingredients"), ingredient => ingredient.IngredientName == "SP imported leek");
    }

    [Fact]
    public async Task With_syncTags_an_import_deletes_the_tags_the_package_does_not_name()
    {
        using var factory = new MatfloteFactory();
        var client = factory.CreateClient();
        var rice = await CreateIngredient(client, "SP rice", "Grain");

        var response = await client.PostAsync("/api/seed-catalog/import-package?syncTags=true", Package());

        await response.EnsureStatus(HttpStatusCode.NoContent);
        Assert.Equal(["Vegetable"], await TagNames(client));
        Assert.Empty((await client.GetJson<IngredientDto>($"/api/ingredients/{rice.IngredientId}")).Tags);
    }
}
