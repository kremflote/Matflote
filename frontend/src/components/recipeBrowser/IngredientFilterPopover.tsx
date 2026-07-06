import type { RefObject } from "react";
import IngredientThumbnail from "../IngredientThumbnail";
import type { IIngredient } from "../../interfaces/IIngredient";
import type { SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

const popoverWidth = 288;
const popoverHeight = 360;
const viewportMargin = 12;

type IngredientFilterPopoverProps = {
  ingredients: IIngredient[];
  popoverRef: RefObject<HTMLDivElement | null>;
  searchTerm: string;
  selectedIngredientIds: number[];
  theme: SiteTheme;
  x: number;
  y: number;
  onSearchChange: (value: string) => void;
  onToggleIngredient: (ingredientId: number) => void;
};

function IngredientFilterPopover({
  ingredients,
  popoverRef,
  searchTerm,
  selectedIngredientIds,
  theme,
  x,
  y,
  onSearchChange,
  onToggleIngredient,
}: IngredientFilterPopoverProps) {
  const position = getClampedPopoverPosition(x, y);

  return (
    <div
      className={recipeBrowserStyles.ingredientPicker(theme)}
      ref={popoverRef}
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      <input
        aria-label="Search ingredients to include"
        className={recipeBrowserStyles.ingredientPickerSearch(theme)}
        placeholder="search ingredient..."
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className={recipeBrowserStyles.ingredientPickerList}>
        {ingredients.length === 0 ? (
          <p className={recipeBrowserStyles.ingredientPickerEmpty(theme)}>No ingredients found</p>
        ) : (
          ingredients.map((ingredient) => (
            <IngredientThumbnail
              className={recipeBrowserStyles.ingredientPickerItem}
              ingredient={ingredient}
              key={ingredient.ingredientId}
              selected={selectedIngredientIds.includes(ingredient.ingredientId)}
              selectedPresentation="muted"
              theme={theme}
              onClick={() => onToggleIngredient(ingredient.ingredientId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function FilterIcon() {
  return (
    <svg className={recipeBrowserStyles.filterIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5h16l-6.25 7.2v5.2l-3.5 1.9v-7.1L4 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function getClampedPopoverPosition(x: number, y: number) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = Math.max(viewportMargin, Math.min(x, viewportWidth - popoverWidth - viewportMargin));
  const top = Math.max(viewportMargin, Math.min(y + 8, viewportHeight - popoverHeight - viewportMargin));

  return { left, top };
}

export default IngredientFilterPopover;
