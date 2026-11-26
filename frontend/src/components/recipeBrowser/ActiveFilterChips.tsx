import { useLanguage } from "../../contexts";
import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag } from "../../interfaces/IRecipe";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserMode } from "./types";
import FilterChip from "./FilterChip";

type ActiveFilterChipsProps = {
  mode: BrowserMode;
  selectedIngredientTags: IngredientTag[];
  selectedRecipeTags: RecipeTag[];
  selectedIngredients: IIngredient[];
  onClear: () => void;
  onRemoveIngredientTag: (value: IngredientTag) => void;
  onRemoveRecipeTag: (value: RecipeTag) => void;
  onRemoveIngredient: (ingredientId: number) => void;
};

function ActiveFilterChips({
  mode,
  selectedIngredientTags,
  selectedRecipeTags,
  selectedIngredients,
  onClear,
  onRemoveIngredientTag,
  onRemoveRecipeTag,
  onRemoveIngredient,
}: ActiveFilterChipsProps) {
  const { t } = useLanguage();
  const hasIngredientFilters = selectedIngredientTags.length > 0;
  const hasRecipeFilters =
    selectedIngredients.length > 0 ||
    selectedRecipeTags.length > 0;

  const hasVisibleFilters = mode === "ingredients" ? hasIngredientFilters : hasRecipeFilters;

  return (
    <div className={recipeBrowserStyles.activeFilterChips(mode, hasVisibleFilters)}>
      {!hasVisibleFilters && <span className={recipeBrowserStyles.emptyFilterChipSlot} aria-hidden="true" />}
      {mode === "ingredients" &&
        selectedIngredientTags.map((tag) => (
          <FilterChip
            key={tag}
            label={t.enums.ingredientTags[tag] ?? formatLabel(tag)}
            onClick={() => onRemoveIngredientTag(tag)}
          />
        ))}
      {mode === "recipes" &&
        selectedIngredients.map((ingredient) => (
          <FilterChip
            key={`ingredient-${ingredient.ingredientId}`}
            label={`${t.filters.includes}: ${ingredient.ingredientName}`}
            onClick={() => onRemoveIngredient(ingredient.ingredientId)}
          />
        ))}
      {mode === "recipes" &&
        selectedRecipeTags.map((tag) => (
          <FilterChip
            key={tag}
            label={t.enums.recipeTags[tag] ?? formatLabel(tag)}
            onClick={() => onRemoveRecipeTag(tag)}
          />
        ))}
      {hasVisibleFilters && (
        <button className={recipeBrowserStyles.clearFilterChip} type="button" onClick={onClear}>
          {t.common.clearFilters}
        </button>
      )}
    </div>
  );
}

export default ActiveFilterChips;
