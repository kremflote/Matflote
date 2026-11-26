import { useState } from "react";
import { useIngredients, useLanguage, useRecipes } from "../../contexts";
import { imageUploadService, maintenanceService } from "../../services";
import { getApiAssetUrl } from "../../services/apiClient";
import { settingsStyles, type SiteTheme } from "../../styles/appStyles";
import { createThumbnail } from "../../utils/imageThumbnail";

type ThumbnailMaintenanceProps = {
  theme: SiteTheme;
};

/**
 * Creates the missing thumbnails for images recipes and ingredients already use. The browser draws them,
 * the same way it does for a new upload, so the server needs no image library.
 */
function ThumbnailMaintenance({ theme }: ThumbnailMaintenanceProps) {
  const { t } = useLanguage();
  const { refreshRecipes } = useRecipes();
  const { refreshIngredients } = useIngredients();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const createMissingThumbnails = async () => {
    setMessage(null);
    setProgress({ done: 0, total: 0 });
    let created = 0;
    let failed = 0;

    try {
      const { imageUrls } = await maintenanceService.getImagesWithoutThumbnails();
      setProgress({ done: 0, total: imageUrls.length });

      for (const [index, imageUrl] of imageUrls.entries()) {
        try {
          const response = await fetch(getApiAssetUrl(imageUrl) ?? imageUrl);
          const thumbnail = response.ok ? await createThumbnail(await response.blob()) : null;
          if (thumbnail === null) {
            failed += 1;
          } else {
            await imageUploadService.attachThumbnail(imageUrl, thumbnail);
            created += 1;
          }
        } catch {
          failed += 1;
        }

        setProgress({ done: index + 1, total: imageUrls.length });
      }

      setMessage(t.settings.thumbnailsFinished(created, failed));
      if (created > 0) {
        await Promise.all([refreshRecipes(), refreshIngredients()]);
      }
    } catch {
      setMessage(t.settings.couldNotCreateThumbnails);
    } finally {
      setProgress(null);
    }
  };

  return (
    <>
      <button
        className={settingsStyles.secondaryButton}
        disabled={progress !== null}
        type="button"
        onClick={() => void createMissingThumbnails()}
      >
        {progress === null ? t.settings.createThumbnails : t.settings.creatingThumbnails(progress.done, progress.total)}
      </button>
      {message !== null && (
        <p className={settingsStyles.panelBody(theme)} role="status">
          {message}
        </p>
      )}
    </>
  );
}

export default ThumbnailMaintenance;
