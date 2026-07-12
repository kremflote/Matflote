namespace DinnerPlanner.Api.Dtos;

public record AppSettingsDto(
    ShoppingListExportSettingsDto ShoppingListExport,
    SystemInfoDto SystemInfo
);

public record ShoppingListExportSettingsDto(
    string Provider,
    string TaskMode,
    VikunjaSettingsDto Vikunja
);

public record VikunjaSettingsDto(
    string BaseUrl,
    int? ProjectId,
    bool HasApiToken
);

public record UpdateAppSettingsRequest(
    UpdateShoppingListExportSettingsRequest ShoppingListExport
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
