import type { IRecipe } from "../interfaces/IRecipe";
import { getThumbnailSrc } from "../utils/imageThumbnail";
import { colorPalette, siteColorClasses, thumbnailStyles } from "../styles/appStyles";

type RecipeLineThumbnailProps = {
  recipe: Pick<IRecipe, "name" | "imageUrl"> & {
    thumbnailUrl?: string | null;
    subtitle?: string | null;
  };
  selected?: boolean;
  mode?: "default" | "compact";
  className?: string;
  onClick?: () => void;
};

function RecipeLineThumbnail({
  recipe,
  selected = false,
  mode = "default",
  className = "",
  onClick,
}: RecipeLineThumbnailProps) {
  const imageUrl = getThumbnailSrc(recipe);
  const compactClassName = mode === "compact" ? thumbnailStyles.ingredientShellCompact : "";
  const sharedClassName = `${thumbnailStyles.ingredientShell} ${thumbnailStyles.ingredientShellText} ${compactClassName} ${className} ${
    selected ? thumbnailStyles.ingredientSelectedColorBorder : ""
  } ${onClick ? `cursor-pointer ${siteColorClasses.ingredientThumbnailInteractive}` : ""}`;

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
          <img className={thumbnailStyles.ingredientImage} src={imageUrl} alt="" loading="lazy" decoding="async" />
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

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default RecipeLineThumbnail;
