export interface IAppSettings {
  shoppingListExport: IShoppingListExportSettings;
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
