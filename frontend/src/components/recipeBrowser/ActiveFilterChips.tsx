import { useLanguage } from "../../contexts";
import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserMode } from "./types";
import FilterChip from "./FilterChip";

type ActiveFilterChipsProps = {
  mode: BrowserMode;
  selectedIngredientTags: IngredientTag[];
  selectedRecipeTypes: RecipeType[];
  selectedRecipeTags: RecipeTag[];
  selectedIngredients: IIngredient[];
  theme: SiteTheme;
  onClear: () => void;
  onRemoveIngredientTag: (value: IngredientTag) => void;
  onRemoveRecipeType: (value: RecipeType) => void;
  onRemoveRecipeTag: (value: RecipeTag) => void;
  onRemoveIngredient: (ingredientId: number) => void;
};

function ActiveFilterChips({
  mode,
  selectedIngredientTags,
  selectedRecipeTypes,
  selectedRecipeTags,
  selectedIngredients,
  theme,
  onClear,
  onRemoveIngredientTag,
  onRemoveRecipeType,
  onRemoveRecipeTag,
  onRemoveIngredient,
}: ActiveFilterChipsProps) {
  const { t } = useLanguage();
  const hasIngredientFilters = selectedIngredientTags.length > 0;
  const hasRecipeFilters =
    selectedIngredients.length > 0 ||
    selectedRecipeTypes.length > 0 ||
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
            theme={theme}
            onClick={() => onRemoveIngredientTag(tag)}
          />
        ))}
      {mode === "recipes" &&
        selectedIngredients.map((ingredient) => (
          <FilterChip
            key={`ingredient-${ingredient.ingredientId}`}
            label={`${t.filters.includes}: ${ingredient.ingredientName}`}
            theme={theme}
            onClick={() => onRemoveIngredient(ingredient.ingredientId)}
          />
        ))}
      {mode === "recipes" &&
        selectedRecipeTypes.map((type) => (
          <FilterChip
            key={type}
            label={t.enums.recipeTypes[type]}
            theme={theme}
            onClick={() => onRemoveRecipeType(type)}
          />
        ))}
      {mode === "recipes" &&
        selectedRecipeTags.map((tag) => (
          <FilterChip
            key={tag}
            label={t.enums.recipeTags[tag] ?? formatLabel(tag)}
            theme={theme}
            onClick={() => onRemoveRecipeTag(tag)}
          />
        ))}
      {hasVisibleFilters && (
        <button className={recipeBrowserStyles.clearFilterChip(theme)} type="button" onClick={onClear}>
          {t.common.clearFilters}
        </button>
      )}
    </div>
  );
}

export default ActiveFilterChips;
