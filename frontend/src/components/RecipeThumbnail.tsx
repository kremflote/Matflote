import type { ReactNode } from "react";
import { useLanguage } from "../contexts";
import type { IRecipe } from "../interfaces/IRecipe";
import { getThumbnailSrc } from "../utils/imageThumbnail";
import type { TileIngredientLine } from "../utils/recipeTile";
import RecipeFallbackTile from "./RecipeFallbackTile";
import { thumbnailStyles, type SiteTheme } from "../styles/appStyles";

type RecipeThumbnailProps = {
  recipe: Pick<IRecipe, "name" | "imageUrl"> & {
    thumbnailUrl?: string | null;
    subtitle?: string | null;
    /** Lets a recipe without a photo show its ingredients' colours instead of a blank block. */
    ingredients?: readonly TileIngredientLine[];
  };
  className?: string;
  interactiveEffect?: boolean;
  ariaPressed?: boolean;
  textScale?: "default" | "compact" | "micro";
  titleBandExtra?: ReactNode;
  titleBandExpanded?: boolean;
  theme?: SiteTheme;
  onClick?: () => void;
};

function RecipeThumbnail({
  recipe,
  className = "",
  interactiveEffect = true,
  ariaPressed,
  textScale = "default",
  titleBandExtra,
  titleBandExpanded = false,
  theme = "dark",
  onClick,
}: RecipeThumbnailProps) {
  const { t } = useLanguage();
  const subtitle = recipe.subtitle ?? "";
  const imageUrl = getThumbnailSrc(recipe);
  const titleClassName =
    textScale === "micro"
      ? thumbnailStyles.recipeTitleMicro
      : textScale === "compact"
        ? thumbnailStyles.recipeTitleCompact
        : thumbnailStyles.recipeTitle;
  const subtitleLayoutClassName =
    textScale === "micro"
      ? thumbnailStyles.recipeSubtitleLayoutMicro
      : textScale === "compact"
        ? thumbnailStyles.recipeSubtitleLayoutCompact
        : thumbnailStyles.recipeSubtitleLayout;
  const titleBandLayoutClassName =
    titleBandExpanded
      ? thumbnailStyles.recipeTitleBandLayoutExpanded
      : textScale === "micro"
        ? thumbnailStyles.recipeTitleBandLayoutMicro
        : thumbnailStyles.recipeTitleBandLayout;
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
          decoding="async"
        />
      ) : (
        <RecipeFallbackTile
          initialsPosition="top"
          recipe={recipe}
          showInitials={textScale !== "micro"}
        />
      )}

      <div className={thumbnailStyles.recipeImageOverlay(theme)} aria-hidden="true" />

      <div className={`${titleBandLayoutClassName} ${thumbnailStyles.recipeTitleBand(theme)}`}>
        {titleBandExtra !== undefined && (
          <div className={thumbnailStyles.recipeTitleBandExtra}>
            {titleBandExtra}
          </div>
        )}
        <h3 className={titleClassName}>{recipe.name}</h3>
        <p className={`${subtitleLayoutClassName} ${thumbnailStyles.recipeSubtitle(theme)}`}>{subtitle}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={t.common.openNamed(recipe.name)}
        aria-pressed={ariaPressed}
        className={sharedClassName}
        type="button"
        onClick={onClick}
      >
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
