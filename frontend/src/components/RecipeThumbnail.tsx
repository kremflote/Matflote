import type { IRecipe } from "../interfaces/IRecipe";
import { getApiAssetUrl } from "../services/apiClient";
import { thumbnailStyles, type SiteTheme } from "../styles/appStyles";

type RecipeThumbnailProps = {
  recipe: Pick<IRecipe, "name" | "imageUrl"> & {
    cuisine?: string | null;
    subtitle?: string | null;
  };
  className?: string;
  interactiveEffect?: boolean;
  textScale?: "default" | "compact";
  theme?: SiteTheme;
  onClick?: () => void;
};

function RecipeThumbnail({
  recipe,
  className = "",
  interactiveEffect = true,
  textScale = "default",
  theme = "dark",
  onClick,
}: RecipeThumbnailProps) {
  const subtitle = recipe.subtitle ?? recipe.cuisine ?? "No cuisine";
  const imageUrl = getApiAssetUrl(recipe.imageUrl);
  const titleClassName =
    textScale === "compact" ? thumbnailStyles.recipeTitleCompact : thumbnailStyles.recipeTitle;
  const subtitleLayoutClassName =
    textScale === "compact" ? thumbnailStyles.recipeSubtitleLayoutCompact : thumbnailStyles.recipeSubtitleLayout;
  const sharedClassName = `${thumbnailStyles.recipeShell} ${className} ${
    onClick ? (interactiveEffect ? thumbnailStyles.recipeShellInteractive : "cursor-pointer") : ""
  }`;
  const content = (
    <>
      {imageUrl ? (
        <img
          className={thumbnailStyles.recipeImage}
          src={imageUrl}
          alt={recipe.name}
          loading="lazy"
        />
      ) : (
        <div className={thumbnailStyles.recipeImageFallback} aria-hidden="true" />
      )}

      <div className={thumbnailStyles.recipeImageOverlay(theme)} aria-hidden="true" />

      <div className={`${thumbnailStyles.recipeTitleBandLayout} ${thumbnailStyles.recipeTitleBand(theme)}`}>
        <h3 className={titleClassName}>{recipe.name}</h3>
        <p className={`${subtitleLayoutClassName} ${thumbnailStyles.recipeSubtitle(theme)}`}>{subtitle}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button className={sharedClassName} type="button" aria-label={`Open ${recipe.name}`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <article className={sharedClassName} aria-label={recipe.name}>
      {content}
    </article>
  );
}

export default RecipeThumbnail;
