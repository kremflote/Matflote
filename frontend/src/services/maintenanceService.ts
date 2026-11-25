import type { IImageCleanupReport } from "../interfaces/IMaintenance";
import { apiRequest } from "./apiClient";

export const maintenanceService = {
  getImageCleanupReport: () =>
    apiRequest<IImageCleanupReport>("/api/maintenance/images/report"),
  /** Images that recipes or ingredients use and that have no thumbnail yet. */
  getImagesWithoutThumbnails: () =>
    apiRequest<{ imageUrls: string[] }>("/api/maintenance/images/missing-thumbnails"),
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
