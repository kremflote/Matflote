// MATFLOTE: Request/response contracts for AppSettings API calls.
// Note: DTOs are kept separate from EF entities so the browser sees stable shapes without inheriting database navigation details.

namespace DinnerPlanner.Api.Dtos;

public record AppSettingsDto(
    ShoppingListExportSettingsDto ShoppingListExport,
    ExternalIntegrationSettingsDto ExternalIntegrations,
    SystemInfoDto SystemInfo
);

public record ShoppingListExportSettingsDto(
    string Provider,
    string TaskMode,
    VikunjaSettingsDto Vikunja,
    IReadOnlyCollection<string> DefaultExcludedIngredientTags
);

public record VikunjaSettingsDto(
    string BaseUrl,
    int? ProjectId,
    bool HasApiToken
);

public record ExternalIntegrationSettingsDto(
    KassalappSettingsDto Kassalapp,
    HelsedirektoratetSettingsDto Helsedirektoratet
);

public record KassalappSettingsDto(
    string BaseUrl,
    bool HasApiKey
);

public record HelsedirektoratetSettingsDto(
    string BaseUrl,
    bool HasSubscriptionKey
);

public record UpdateAppSettingsRequest(
    UpdateShoppingListExportSettingsRequest ShoppingListExport,
    UpdateExternalIntegrationSettingsRequest ExternalIntegrations
);

public record UpdateShoppingListExportSettingsRequest(
    string Provider,
    string TaskMode,
    UpdateVikunjaSettingsRequest Vikunja
);

public record UpdateVikunjaSettingsRequest(
    string BaseUrl,
    int? ProjectId,
    string? ApiToken
);

public record UpdateExternalIntegrationSettingsRequest(
    UpdateKassalappSettingsRequest Kassalapp,
    UpdateHelsedirektoratetSettingsRequest Helsedirektoratet
);

public record UpdateKassalappSettingsRequest(
    string BaseUrl,
    string? ApiKey
);

public record UpdateHelsedirektoratetSettingsRequest(
    string BaseUrl,
    string? SubscriptionKey
);

public record UpdateGroceryExportRulesRequest(
    IReadOnlyCollection<string>? DefaultExcludedIngredientTags
);

public record SystemInfoDto(
    string EnvironmentName,
    string DatabaseProvider,
    string ImageStorageRootPath
);

public record TestConnectionResultDto(
    string Provider,
    bool Success,
    string Message
);
