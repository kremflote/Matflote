import type { IIngredient } from "../interfaces/IIngredient";
import { colorPalette, thumbnailStyles, type SiteTheme } from "../styles/appStyles";

type IngredientThumbnailProps = {
  ingredient: Pick<IIngredient, "ingredientName" | "tags" | "brand" | "color">;
  theme?: SiteTheme;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

type IngredientTone = {
  background: string;
  dot: string;
  text: string;
};

function IngredientThumbnail({
  ingredient,
  theme = "dark",
  selected = false,
  disabled = false,
  className = "",
  onClick,
}: IngredientThumbnailProps) {
  const brandName = ingredient.brand?.name ?? "";
  const tone = getIngredientTone(ingredient.color, theme);
  const sharedClassName = `${thumbnailStyles.ingredientShell} ${className} ${
    selected ? "outline outline-2 outline-current" : ""
  } ${disabled ? "cursor-not-allowed" : onClick ? "cursor-pointer" : ""}`;
  const style = {
    backgroundColor: tone.background,
    color: tone.text,
  };

  const content = (
    <>
      <span
        aria-hidden="true"
        className={thumbnailStyles.ingredientDot}
        style={{ backgroundColor: tone.dot }}
      />
      <span className={thumbnailStyles.ingredientName}>
        {ingredient.ingredientName}
      </span>
      {brandName && (
        <span className={thumbnailStyles.ingredientBrand}>
          {brandName}
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

function getIngredientTone(color: string | null, theme: SiteTheme): IngredientTone {
  const background =
    theme === "paletteLight"
      ? colorPalette.ivory
      : theme === "dark"
        ? colorPalette.nearBlack
        : colorPalette.softGray;
  const dot = color ?? colorPalette.ingredientIconText;
  const text = colorPalette.ingredientIconText;

  return {
    background,
    dot,
    text,
  };
}

export default IngredientThumbnail;
