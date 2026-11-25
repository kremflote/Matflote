
using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using QuestPDF.Infrastructure;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License = LicenseType.Community;

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<CatalogVersion>();
builder.Services.AddSingleton<CatalogVersionInterceptor>();
builder.Services.AddDbContext<DinnerPlannerContext>((services, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("DinnerPlanner")
        ?? "Data Source=dinnerplanner.db";

    options.UseSqlite(connectionString);
    options.AddInterceptors(services.GetRequiredService<CatalogVersionInterceptor>());
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ImageStoragePathProvider>();
builder.Services.AddScoped<AppSettingsService>();
builder.Services.AddScoped<AssistantService>();
builder.Services.AddScoped<VikunjaOptionsResolver>();
builder.Services.AddScoped<GroceryListService>();
builder.Services.AddScoped<ImageMaintenanceService>();
builder.Services.AddScoped<MealPlanWriter>();
builder.Services.AddScoped<NutritionReferenceImportService>();
builder.Services.AddScoped<HelsedirektoratetNutritionReferenceParser>();
builder.Services.AddScoped<NutritionSummaryService>();
builder.Services.AddScoped<RecipePdfService>();
builder.Services.AddScoped<SeedCatalogService>();
builder.Services.AddScoped<ShoppingListExportService>();
builder.Services.AddScoped<SystemTagService>();
builder.Services.AddScoped<TagCatalogService>();
builder.Services.AddHttpClient<MatvaretabellenNutritionLookupService>();
builder.Services.AddHttpClient<HelsedirektoratetContentClient>();
builder.Services.AddHttpClient<KassalappProductLookupService>();
builder.Services.AddHttpClient<VikunjaShoppingListExporter>();
builder.Services.AddScoped<IShoppingListExporter>(provider => provider.GetRequiredService<VikunjaShoppingListExporter>());

var app = builder.Build();

await PrepareDatabaseAsync(app);
PrepareImageStorage(app.Services.GetRequiredService<ImageStoragePathProvider>());
await RecordSeedImageMetadataAsync(app);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new
        {
            Error = "An unexpected server error occurred."
        });
    });
});

app.UseCors();
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(app.Services.GetRequiredService<ImageStoragePathProvider>().RootPath),
    RequestPath = "/images",
    // Uploads get a new GUID name and are never changed in place, so browsers may keep them for a year.
    OnPrepareResponse = context =>
        context.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable"
});
app.UseStaticFiles();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    Status = "Healthy",
    CheckedAt = DateTimeOffset.UtcNow
}));

app.MapFallbackToFile("index.html");

app.Run();

static async Task PrepareDatabaseAsync(WebApplication app)
{
    var connectionString = app.Configuration.GetConnectionString("DinnerPlanner")
        ?? "Data Source=dinnerplanner.db";

    EnsureSqliteDirectory(connectionString, app.Environment.ContentRootPath);

    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<DinnerPlannerContext>();
    await BackUpBeforeMigratingAsync(app, context, connectionString);
    await context.Database.MigrateAsync();

    var tagCatalog = scope.ServiceProvider.GetRequiredService<TagCatalogService>();
    await tagCatalog.RemoveOrphanedAssignmentsAsync();
    await context.SaveChangesAsync();

    var seedCatalogService = scope.ServiceProvider.GetRequiredService<SeedCatalogService>();
    await seedCatalogService.ImportConfiguredCatalogAsync();

    var systemTagService = scope.ServiceProvider.GetRequiredService<SystemTagService>();
    await systemTagService.EnsureRequiredTagsAsync();
}

static async Task BackUpBeforeMigratingAsync(WebApplication app, DinnerPlannerContext context, string connectionString)
{
    var databasePath = DatabaseBackup.ResolveDatabasePath(connectionString);
    if (databasePath is null || !File.Exists(databasePath))
    {
        return;
    }

    var pending = (await context.Database.GetPendingMigrationsAsync()).ToList();
    if (pending.Count == 0)
    {
        return;
    }

    var backupPath = await DatabaseBackup.CreateAsync(connectionString, databasePath, DateTime.Now);
    app.Logger.LogInformation(
        "Copied the database to {BackupPath} before applying {Count} migration(s): {Migrations}",
        backupPath,
        pending.Count,
        string.Join(", ", pending));
}

static void EnsureSqliteDirectory(string connectionString, string contentRootPath)
{
    var builder = new SqliteConnectionStringBuilder(connectionString);
    var dataSource = builder.DataSource;

    if (string.IsNullOrWhiteSpace(dataSource) || dataSource == ":memory:")
    {
        return;
    }

    var databasePath = Path.IsPathRooted(dataSource)
        ? dataSource
        : Path.GetFullPath(Path.Combine(contentRootPath, dataSource));
    var databaseDirectory = Path.GetDirectoryName(databasePath);

    if (!string.IsNullOrWhiteSpace(databaseDirectory))
    {
        Directory.CreateDirectory(databaseDirectory);
    }
}

static void PrepareImageStorage(ImageStoragePathProvider imageStorage)
{
    Directory.CreateDirectory(imageStorage.RootPath);

    if (!Directory.Exists(imageStorage.SeedRootPath))
    {
        return;
    }

    foreach (var sourcePath in Directory.EnumerateFiles(imageStorage.SeedRootPath, "*", SearchOption.AllDirectories))
    {
        var relativePath = Path.GetRelativePath(imageStorage.SeedRootPath, sourcePath);
        var destinationPath = Path.Combine(imageStorage.RootPath, relativePath);
        var destinationDirectory = Path.GetDirectoryName(destinationPath);

        if (!string.IsNullOrWhiteSpace(destinationDirectory))
        {
            Directory.CreateDirectory(destinationDirectory);
        }

        if (!File.Exists(destinationPath))
        {
            File.Copy(sourcePath, destinationPath);
        }
    }
}

static async Task RecordSeedImageMetadataAsync(WebApplication app)
{
    var imageStorage = app.Services.GetRequiredService<ImageStoragePathProvider>();
    if (!Directory.Exists(imageStorage.SeedRootPath))
    {
        return;
    }

    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<DinnerPlannerContext>();

    foreach (var sourcePath in Directory.EnumerateFiles(imageStorage.SeedRootPath, "*", SearchOption.AllDirectories))
    {
        var relativePath = Path.GetRelativePath(imageStorage.SeedRootPath, sourcePath).Replace('\\', '/');
        var publicUrl = $"/images/{relativePath}";

        var exists = await context.UploadedImages.AnyAsync(image => image.PublicUrl == publicUrl);
        if (exists)
        {
            continue;
        }

        var fileInfo = new FileInfo(sourcePath);
        context.UploadedImages.Add(new UploadedImage
        {
            FileName = fileInfo.Name,
            PublicUrl = publicUrl,
            RelativePath = relativePath,
            Folder = Path.GetDirectoryName(relativePath)?.Replace('\\', '/') ?? "general",
            Source = "Seed",
            OriginalFileName = fileInfo.Name,
            ContentType = GetContentType(fileInfo.Extension),
            SizeBytes = fileInfo.Length,
            CreatedAt = DateTimeOffset.UtcNow
        });
    }

    await context.SaveChangesAsync();
}

static string? GetContentType(string extension) =>
    extension.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        _ => null
    };

// Lets WebApplicationFactory<Program> in backend.Tests reach the entry point of the top-level statements.
public partial class Program;
