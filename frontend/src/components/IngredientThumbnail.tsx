import type { IIngredient } from "../interfaces/IIngredient";
import { getApiAssetUrl } from "../services/apiClient";
import { colorPalette, siteColorClasses, thumbnailStyles, type SiteTheme } from "../styles/appStyles";

type IngredientThumbnailProps = {
  ingredient: Pick<IIngredient, "ingredientName" | "tags" | "brand" | "color" | "imageUrl">;
  theme?: SiteTheme;
  selected?: boolean;
  selectedPresentation?: "outline" | "muted" | "colorBorder";
  mode?: "default" | "compact";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

type IngredientTone = {
  dot: string;
  text: string;
};

function IngredientThumbnail({
  ingredient,
  theme = "dark",
  selected = false,
  selectedPresentation = "outline",
  mode = "default",
  disabled = false,
  className = "",
  onClick,
}: IngredientThumbnailProps) {
  const brandName = ingredient.brand?.name ?? "";
  const tone = getIngredientTone(ingredient.color, theme);
  const imageUrl = getApiAssetUrl(ingredient.imageUrl);
  const selectedClassName =
    selectedPresentation === "colorBorder"
      ? thumbnailStyles.ingredientSelectedColorBorder
      : selectedPresentation === "muted"
      ? thumbnailStyles.ingredientSelectedMuted
      : thumbnailStyles.ingredientSelectedOutline;
  const compactClassName = mode === "compact" ? thumbnailStyles.ingredientShellCompact : "";
  const sharedClassName = `${thumbnailStyles.ingredientShell(theme)} ${compactClassName} ${className} ${
    selected ? selectedClassName : ""
  } ${disabled ? "cursor-not-allowed" : onClick ? `cursor-pointer ${siteColorClasses[theme].ingredientThumbnailInteractive}` : ""}`;
  const style = {
    color: tone.text,
    ...(selected && selectedPresentation === "colorBorder" ? { borderColor: tone.dot } : {}),
  };

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`${thumbnailStyles.ingredientImageFrame} ${
          mode === "compact" ? thumbnailStyles.ingredientImageFrameCompact : ""
        }`}
        style={{ backgroundColor: tone.dot }}
      >
        {imageUrl === null ? (
          <span className={thumbnailStyles.ingredientImageFallback}>
            {getInitials(ingredient.ingredientName)}
          </span>
        ) : (
          <img className={thumbnailStyles.ingredientImage} src={imageUrl} alt="" />
        )}
      </span>
      <span className={thumbnailStyles.ingredientContent}>
        <span className={`${thumbnailStyles.ingredientName} ${
          mode === "compact" ? thumbnailStyles.ingredientNameCompact : ""
        }`}>
          {ingredient.ingredientName}
        </span>
        <span className={`${thumbnailStyles.ingredientBrand} ${
          mode === "compact" ? thumbnailStyles.ingredientBrandCompact : ""
        }`}>
          {brandName}
        </span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        aria-pressed={selected}
        className={sharedClassName}
        disabled={disabled}
        style={style}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={sharedClassName} style={style} aria-label={ingredient.ingredientName}>
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

function getIngredientTone(color: string | null, theme: SiteTheme): IngredientTone {
  const dot = color ?? colorPalette.ingredientIconText;
  const text = theme === "dark" ? colorPalette.nearBlack : colorPalette.ingredientIconText;

  return {
    dot,
    text,
  };
}

export default IngredientThumbnail;
