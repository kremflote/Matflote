import type { RefObject } from "react";
import { useLanguage } from "../../contexts";
import IngredientThumbnail from "../IngredientThumbnail";
import SearchField from "../SearchField";
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
  const { t } = useLanguage();
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
      <SearchField
        aria-label={t.browser.searchIngredientsToInclude}
        inputClassName={recipeBrowserStyles.ingredientPickerSearch(theme)}
        placeholder={t.browser.ingredientSearchPlaceholder}
        theme={theme}
        value={searchTerm}
        onChange={onSearchChange}
      />
      <div className={recipeBrowserStyles.ingredientPickerList}>
        {ingredients.length === 0 ? (
          <p className={recipeBrowserStyles.ingredientPickerEmpty(theme)}>{t.browser.noIngredientsFound}</p>
        ) : (
          ingredients.map((ingredient) => {
            const isSelected = selectedIngredientIds.includes(ingredient.ingredientId);

            return (
              <IngredientThumbnail
                className={recipeBrowserStyles.ingredientPickerItem}
                ingredient={ingredient}
                key={ingredient.ingredientId}
                mode="compact"
                selected={!isSelected}
                selectedPresentation="muted"
                theme={theme}
                onClick={() => onToggleIngredient(ingredient.ingredientId)}
              />
            );
          })
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
  const effectivePopoverWidth = Math.min(popoverWidth, viewportWidth - viewportMargin * 2);
  const left = Math.max(viewportMargin, Math.min(x, viewportWidth - effectivePopoverWidth - viewportMargin));
  const preferredTop = viewportWidth <= 1100 ? y - popoverHeight - 8 : y + 8;
  const top = Math.max(viewportMargin, Math.min(preferredTop, viewportHeight - popoverHeight - viewportMargin));

  return { left, top };
}

export default IngredientFilterPopover;
