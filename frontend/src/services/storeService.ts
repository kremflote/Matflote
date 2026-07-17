import type { IStore } from "../interfaces/ILookup";
import { apiRequest } from "./apiClient";
import type { LookupRequest } from "./brandService";

export const storeService = {
  getAll: () => apiRequest<IStore[]>("/api/stores"),
  create: (store: LookupRequest) =>
    apiRequest<IStore>("/api/stores", {
      method: "POST",
      body: store,
    }),
};
