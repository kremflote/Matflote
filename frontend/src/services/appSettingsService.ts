import type { IAppSettings, ITestConnectionResult, IUpdateAppSettingsRequest } from "../interfaces/IAppSettings";
import { apiRequest } from "./apiClient";

export const appSettingsService = {
  get: () => apiRequest<IAppSettings>("/api/app-settings"),
  update: (settings: IUpdateAppSettingsRequest) =>
    apiRequest<IAppSettings>("/api/app-settings", {
      method: "PUT",
      body: settings,
    }),
  testShoppingListExport: (settings: IUpdateAppSettingsRequest["shoppingListExport"]) =>
    apiRequest<ITestConnectionResult>("/api/app-settings/test-shopping-list-export", {
      method: "POST",
      body: settings,
    }),
};
