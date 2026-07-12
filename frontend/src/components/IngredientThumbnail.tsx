import type { IIngredient } from "../interfaces/IIngredient";
import { colorPalette, siteColorClasses, thumbnailStyles, type SiteTheme } from "../styles/appStyles";

type IngredientThumbnailProps = {
  ingredient: Pick<IIngredient, "ingredientName" | "tags" | "brand" | "color">;
  theme?: SiteTheme;
  selected?: boolean;
  selectedPresentation?: "outline" | "muted";
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
  disabled = false,
  className = "",
  onClick,
}: IngredientThumbnailProps) {
  const brandName = ingredient.brand?.name ?? "";
  const tone = getIngredientTone(ingredient.color);
  const selectedClassName =
    selectedPresentation === "muted"
      ? thumbnailStyles.ingredientSelectedMuted
      : thumbnailStyles.ingredientSelectedOutline;
  const sharedClassName = `${thumbnailStyles.ingredientShell(theme)} ${className} ${
    selected ? selectedClassName : ""
  } ${disabled ? "cursor-not-allowed" : onClick ? `cursor-pointer ${siteColorClasses[theme].ingredientThumbnailInteractive}` : ""}`;
  const style = {
    color: tone.text,
  };

  const content = (
    <>
      <span
        aria-hidden="true"
        className={thumbnailStyles.ingredientDot}
        style={{ backgroundColor: tone.dot }}
      />
      <span className={thumbnailStyles.ingredientContent}>
        <span className={thumbnailStyles.ingredientName}>
          {ingredient.ingredientName}
        </span>
        <span className={thumbnailStyles.ingredientBrand}>
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

function getIngredientTone(color: string | null): IngredientTone {
  const dot = color ?? colorPalette.ingredientIconText;
  const text = colorPalette.ingredientIconText;

  return {
    dot,
    text,
  };
}

export default IngredientThumbnail;
