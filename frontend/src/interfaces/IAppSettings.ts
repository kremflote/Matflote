export interface IAppSettings {
  shoppingListExport: IShoppingListExportSettings;
  externalIntegrations: IExternalIntegrationSettings;
  systemInfo: ISystemInfo;
}

export interface IShoppingListExportSettings {
  provider: string;
  taskMode: ShoppingListTaskMode;
  vikunja: IVikunjaSettings;
  defaultExcludedIngredientTags: string[];
}

export type ShoppingListTaskMode = "SingleTask" | "SeparateTasks";

export interface IVikunjaSettings {
  baseUrl: string;
  projectId: number | null;
  hasApiToken: boolean;
}

export interface IExternalIntegrationSettings {
  kassalapp: IKassalappSettings;
  helsedirektoratet: IHelsedirektoratetSettings;
}

export interface IKassalappSettings {
  baseUrl: string;
  hasApiKey: boolean;
}

export interface IHelsedirektoratetSettings {
  baseUrl: string;
  hasSubscriptionKey: boolean;
}

export interface IUpdateAppSettingsRequest {
  shoppingListExport: {
    provider: string;
    taskMode: ShoppingListTaskMode;
    vikunja: {
      baseUrl: string;
      projectId: number | null;
      apiToken: string | null;
    };
  };
  externalIntegrations: {
    kassalapp: {
      baseUrl: string;
      apiKey: string | null;
    };
    helsedirektoratet: {
      baseUrl: string;
      subscriptionKey: string | null;
    };
  };
}

export interface ISystemInfo {
  environmentName: string;
  databaseProvider: string;
  imageStorageRootPath: string;
}

export interface ITestConnectionResult {
  provider: string;
  success: boolean;
  message: string;
}
