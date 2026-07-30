import type { IImageCleanupReport } from "../interfaces/IMaintenance";
import { apiRequest } from "./apiClient";

export const maintenanceService = {
  getImageCleanupReport: () =>
    apiRequest<IImageCleanupReport>("/api/maintenance/images/report"),
  cleanupImages: () =>
    apiRequest<IImageCleanupReport>("/api/maintenance/images/cleanup", {
      method: "POST",
    }),
  importSeedCatalog: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<void>("/api/seed-catalog/import", {
      method: "POST",
      body: formData,
    });
  },
};
