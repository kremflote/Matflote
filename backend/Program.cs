using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddDbContext<DinnerPlannerContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DinnerPlanner")
        ?? "Data Source=dinnerplanner.db";

    options.UseSqlite(connectionString);
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();
builder.Services.AddSingleton<ImageStoragePathProvider>();
builder.Services.AddScoped<AppSettingsService>();
builder.Services.AddScoped<VikunjaOptionsResolver>();
builder.Services.AddScoped<GroceryListService>();
builder.Services.AddScoped<ShoppingListExportService>();
builder.Services.AddHttpClient<VikunjaShoppingListExporter>();
builder.Services.AddScoped<IShoppingListExporter>(provider => provider.GetRequiredService<VikunjaShoppingListExporter>());

var app = builder.Build();

await PrepareDatabaseAsync(app);
PrepareImageStorage(app.Services.GetRequiredService<ImageStoragePathProvider>());

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
    RequestPath = "/images"
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
    await context.Database.MigrateAsync();
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
