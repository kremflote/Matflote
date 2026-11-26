import { useLanguage } from "../../contexts";
import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag } from "../../interfaces/IRecipe";
import { plannerPickerStyles } from "../../styles/appStyles";
import IngredientPickerPopover, { FilterIcon } from "../recipeBrowser/IngredientFilterPopover";
import FilterChip from "../recipeBrowser/FilterChip";
import { recipeBrowserStyles } from "../recipeBrowser/recipeBrowserStyles";

type IngredientFilterChipsProps = {
  mode: "recipes" | "ingredients";
  selectedIngredientTags: IngredientTag[];
  selectedIngredients: IIngredient[];
  selectedRecipeTags: RecipeTag[];
  onClear: () => void;
  onRemoveIngredient: (ingredientId: number) => void;
  onRemoveIngredientTag: (tag: IngredientTag) => void;
  onRemoveRecipeTag: (tag: RecipeTag) => void;
};

export function IngredientFilterChips({
  mode,
  selectedIngredientTags,
  selectedIngredients,
  selectedRecipeTags,
  onClear,
  onRemoveIngredient,
  onRemoveIngredientTag,
  onRemoveRecipeTag,
}: IngredientFilterChipsProps) {
  const { t } = useLanguage();
  const hasRecipeFilters = selectedIngredients.length > 0 || selectedRecipeTags.length > 0;
  const hasIngredientFilters = selectedIngredientTags.length > 0;
  const hasVisibleFilters = mode === "recipes" ? hasRecipeFilters : hasIngredientFilters;

  if (!hasVisibleFilters) {
    return null;
  }

  return (
    <div className={plannerPickerStyles.ingredientFilterChips}>
      {mode === "recipes" && selectedIngredients.map((ingredient) => (
        <FilterChip
          key={ingredient.ingredientId}
          label={`${t.filters.includes}: ${ingredient.ingredientName}`}
          onClick={() => onRemoveIngredient(ingredient.ingredientId)}
        />
      ))}
      {mode === "recipes" && selectedRecipeTags.map((tag) => (
        <FilterChip
          key={tag}
          label={t.enums.recipeTags[tag] ?? t.enums.ingredientTags[tag] ?? tag}
          onClick={() => onRemoveRecipeTag(tag)}
        />
      ))}
      {mode === "ingredients" && selectedIngredientTags.map((tag) => (
        <FilterChip
          key={tag}
          label={t.enums.ingredientTags[tag] ?? tag}
          onClick={() => onRemoveIngredientTag(tag)}
        />
      ))}
      <button className={recipeBrowserStyles.clearFilterChip} type="button" onClick={onClear}>
        {t.common.clearFilters}
      </button>
    </div>
  );
}

export { FilterIcon };
export { IngredientPickerPopover };
