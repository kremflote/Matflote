import type { IGroceryList, IShoppingListExportResult } from "../interfaces/IGroceryList";
import { apiRequest } from "./apiClient";

export const groceryListService = {
  preview: (from: string, to: string) => {
    const query = new URLSearchParams({ from, to });
    return apiRequest<IGroceryList>(`/api/grocerylists/preview?${query.toString()}`);
  },
  exportSelected: (groceryList: IGroceryList) =>
    apiRequest<IShoppingListExportResult>("/api/grocerylists/export/selected", {
      method: "POST",
      body: { groceryList },
    }),
};
