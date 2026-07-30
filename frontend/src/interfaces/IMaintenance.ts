export interface IImageCleanupReport {
  unusedUploadedImages: IImageCleanupItem[];
  untrackedImageFiles: IImageCleanupItem[];
}

export interface IImageCleanupItem {
  publicUrl: string;
  relativePath: string;
  sizeBytes: number | null;
}
