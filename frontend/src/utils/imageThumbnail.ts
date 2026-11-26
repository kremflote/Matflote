import { getApiAssetUrl } from "../services/apiClient";

/** Edge length of the shorter side of a thumbnail, in pixels. */
export const thumbnailEdgePixels = 320;
const thumbnailQuality = 0.8;

type HasImage = { imageUrl: string | null; thumbnailUrl?: string | null };

/** The small image for grids, cards and previews; the full image when no thumbnail has been made yet. */
export function getThumbnailSrc(item: HasImage | null | undefined) {
  if (item === null || item === undefined) {
    return null;
  }

  return getApiAssetUrl(item.thumbnailUrl ?? item.imageUrl);
}

/** The width and height that make the shorter side `edge` pixels, never enlarging the image. */
export function getThumbnailSize(width: number, height: number, edge = thumbnailEdgePixels) {
  const scale = Math.min(1, edge / Math.max(1, Math.min(width, height)));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Draws a JPEG thumbnail of an image in the browser. Returns null when the browser cannot decode it. */
export async function createThumbnail(source: Blob): Promise<File | null> {
  try {
    const image = await createImageBitmap(source, { imageOrientation: "from-image" });
    const size = getThumbnailSize(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (context === null) {
      image.close();
      return null;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, size.width, size.height);
    image.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", thumbnailQuality));
    return blob === null ? null : new File([blob], "thumbnail.jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return null;
  }
}
