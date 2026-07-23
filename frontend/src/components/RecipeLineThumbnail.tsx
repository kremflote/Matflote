import type { IRecipe } from "../interfaces/IRecipe";
import { getApiAssetUrl } from "../services/apiClient";
import { colorPalette, siteColorClasses, thumbnailStyles, type SiteTheme } from "../styles/appStyles";

type RecipeLineThumbnailProps = {
  recipe: Pick<IRecipe, "name" | "imageUrl"> & {
    subtitle?: string | null;
  };
  theme?: SiteTheme;
  selected?: boolean;
  mode?: "default" | "compact";
  className?: string;
  onClick?: () => void;
};

function RecipeLineThumbnail({
  recipe,
  theme = "dark",
  selected = false,
  mode = "default",
  className = "",
  onClick,
}: RecipeLineThumbnailProps) {
  const imageUrl = getApiAssetUrl(recipe.imageUrl);
  const compactClassName = mode === "compact" ? thumbnailStyles.ingredientShellCompact : "";
  const sharedClassName = `${thumbnailStyles.ingredientShell(theme)} ${compactClassName} ${className} ${
    selected ? thumbnailStyles.ingredientSelectedColorBorder : ""
  } ${onClick ? `cursor-pointer ${siteColorClasses[theme].ingredientThumbnailInteractive}` : ""}`;
  const style = {
    color: theme === "dark" ? colorPalette.ivory : colorPalette.ingredientIconText,
    ...(selected ? { borderColor: colorPalette.olive } : {}),
  };

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`${thumbnailStyles.ingredientImageFrame} ${
          mode === "compact" ? thumbnailStyles.ingredientImageFrameCompact : ""
        }`}
        style={{ backgroundColor: colorPalette.ingredientIcon }}
      >
        {imageUrl === null ? (
          <span className={thumbnailStyles.ingredientImageFallback}>
            {getInitials(recipe.name)}
          </span>
        ) : (
          <img className={thumbnailStyles.ingredientImage} src={imageUrl} alt="" />
        )}
      </span>
      <span className={thumbnailStyles.ingredientContent}>
        <span className={`${thumbnailStyles.ingredientName} ${
          mode === "compact" ? thumbnailStyles.ingredientNameCompact : ""
        }`}>
          {recipe.name}
        </span>
        <span className={`${thumbnailStyles.ingredientBrand} ${
          mode === "compact" ? thumbnailStyles.ingredientBrandCompact : ""
        }`}>
          {recipe.subtitle ?? ""}
        </span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        aria-pressed={selected}
        className={sharedClassName}
        style={style}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={sharedClassName} style={style} aria-label={recipe.name}>
      {content}
    </article>
  );
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default RecipeLineThumbnail;
