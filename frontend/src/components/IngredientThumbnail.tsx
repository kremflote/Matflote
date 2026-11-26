import type { ReactNode } from "react";
import type { IIngredient } from "../interfaces/IIngredient";
import { getThumbnailSrc } from "../utils/imageThumbnail";
import { colorPalette, siteColorClasses, thumbnailStyles } from "../styles/appStyles";

type IngredientThumbnailProps = {
  ingredient: Pick<IIngredient, "ingredientName" | "tags" | "brand" | "color" | "imageUrl"> & {
    thumbnailUrl?: string | null;
  };
  selected?: boolean;
  selectedPresentation?: "outline" | "muted" | "colorBorder";
  mode?: "default" | "compact";
  disabled?: boolean;
  className?: string;
  contentExtra?: ReactNode;
  footerExtra?: ReactNode;
  onClick?: () => void;
};

function IngredientThumbnail({
  ingredient,
  selected = false,
  selectedPresentation = "outline",
  mode = "default",
  disabled = false,
  className = "",
  contentExtra,
  footerExtra,
  onClick,
}: IngredientThumbnailProps) {
  const brandName = ingredient.brand?.name ?? "";
  const dotColor = ingredient.color ?? colorPalette.ingredientIconText;
  const imageUrl = getThumbnailSrc(ingredient);
  const selectedClassName =
    selectedPresentation === "colorBorder"
      ? thumbnailStyles.ingredientSelectedColorBorder
      : selectedPresentation === "muted"
      ? thumbnailStyles.ingredientSelectedMuted
      : thumbnailStyles.ingredientSelectedOutline;
  const compactClassName = mode === "compact" ? thumbnailStyles.ingredientShellCompact : "";
  const sharedClassName = `${thumbnailStyles.ingredientShell} ${thumbnailStyles.ingredientShellText} ${compactClassName} ${className} ${
    selected ? selectedClassName : ""
  } ${disabled ? "cursor-not-allowed" : onClick ? `cursor-pointer ${siteColorClasses.ingredientThumbnailInteractive}` : ""}`;

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`${thumbnailStyles.ingredientImageFrame} ${
          mode === "compact" ? thumbnailStyles.ingredientImageFrameCompact : ""
        }`}
        style={{ backgroundColor: dotColor }}
      >
        {imageUrl === null ? (
          <span className={thumbnailStyles.ingredientImageFallback}>
            {getInitials(ingredient.ingredientName)}
          </span>
        ) : (
          <img className={thumbnailStyles.ingredientImage} src={imageUrl} alt="" loading="lazy" decoding="async" />
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
        {contentExtra}
      </span>
      {footerExtra !== undefined && (
        <span className={thumbnailStyles.ingredientFooter}>
          {footerExtra}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        aria-pressed={selected}
        className={sharedClassName}
        disabled={disabled}
       
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={sharedClassName} aria-label={ingredient.ingredientName}>
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

export default IngredientThumbnail;
