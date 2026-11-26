import { getRecipeTile, getRecipeTileBackground, type TileRecipe } from "../utils/recipeTile";
import { thumbnailStyles } from "../styles/appStyles";

type RecipeFallbackTileProps = {
  recipe: TileRecipe;
  className?: string;
  /** Where the initials sit; "top" leaves the lower part free for a title band. */
  initialsPosition?: "center" | "top";
  /** Hide the initials, for very small previews. */
  showInitials?: boolean;
};

/**
 * Stands in for a recipe photo: the colours of the recipe's heaviest ingredients with its initials,
 * the way an ingredient without a photo shows its colour and initials.
 */
function RecipeFallbackTile({
  recipe,
  className = "",
  initialsPosition = "center",
  showInitials = true,
}: RecipeFallbackTileProps) {
  const tile = getRecipeTile(recipe);

  return (
    <div
      aria-hidden="true"
      className={`${thumbnailStyles.recipeTile} ${className}`}
      data-testid="recipe-fallback-tile"
      style={{ background: getRecipeTileBackground(tile.colors), color: tile.textColor }}
    >
      {showInitials && (
        <span
          className={
            initialsPosition === "top"
              ? thumbnailStyles.recipeTileInitialsTop
              : thumbnailStyles.recipeTileInitials
          }
        >
          {tile.initials}
        </span>
      )}
    </div>
  );
}

export default RecipeFallbackTile;
