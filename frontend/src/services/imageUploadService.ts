export interface ImageUploadResponse {
  fileName: string;
  url: string;
}

export type ImageFolder =
  | "general"
  | "ingredients"
  | "recipes"
  | "dishes"
  | "sauces"
  | "dips"
  | "sides"
  | "desserts"
  | "marinades"
  | "spice-mixes";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5132";

export const imageUploadService = {
  upload: async (file: File, folder: ImageFolder = "general"): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch(`${API_BASE_URL}/api/imageuploads`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json() as Promise<ImageUploadResponse>;
  },
};
