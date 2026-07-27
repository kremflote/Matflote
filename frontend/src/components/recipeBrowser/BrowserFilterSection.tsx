import type { Dispatch, SetStateAction } from "react";
import { useIngredientTagCategories, useLanguage } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { formatIngredientTagCategoryName, formatRecipeTagGroupName, getIngredientTagGroupsWithCustomTags, getRecipeTagGroupsWithCustomTags, ingredientTagGroups, recipeTagGroups } from "./formOptions";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import { GroupedFilterGroup } from "./BrowserFilterGroups";
import type { BrowserMode } from "./types";

type BrowserFilterSectionProps = {
  mode: BrowserMode;
  selectedIngredientTags: IngredientTag[];
  selectedRecipeTags: RecipeTag[];
  theme: SiteTheme;
  variant?: "rail" | "panel";
  setSelectedIngredientTags: Dispatch<SetStateAction<IngredientTag[]>>;
  setSelectedRecipeTags: Dispatch<SetStateAction<RecipeTag[]>>;
};

function BrowserFilterSection({
  mode,
  selectedIngredientTags,
  selectedRecipeTags,
  theme,
  variant = "rail",
  setSelectedIngredientTags,
  setSelectedRecipeTags,
}: BrowserFilterSectionProps) {
  const { t } = useLanguage();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const className = variant === "rail"
    ? recipeBrowserStyles.filterRail(theme)
    : recipeBrowserStyles.filterPanel(theme);
  const liveIngredientTagGroups = getIngredientTagGroupsWithCustomTags([], "pantry", ingredientTagCategories);
  const ingredientTagGroupLabels = ingredientTagCategories.length === 0
    ? t.filters.ingredientTagGroups
    : Object.fromEntries(
        ingredientTagCategories.map((category) => [
          category.ingredientTagCategoryId.toString(),
          formatIngredientTagCategoryName(category.name, t.filters.ingredientTagGroups),
        ]),
      );
  const liveRecipeTagGroups = getRecipeTagGroupsWithCustomTags([], "style", ingredientTagCategories);
  const recipeTagGroupLabels = ingredientTagCategories.length === 0
    ? t.filters.recipeTagGroups
    : Object.fromEntries(
        ingredientTagCategories.map((category) => [
          category.ingredientTagCategoryId.toString(),
          formatRecipeTagGroupName(category.name, t.filters.recipeTagGroups),
        ]),
      );

  return (
    <aside className={className} aria-label={t.filters.recipeFilters}>
      {mode === "ingredients" ? (
        <GroupedFilterGroup
          formatValue={(value) => t.enums.ingredientTags[value] ?? formatLabel(value)}
          groupLabels={ingredientTagGroupLabels}
          groups={ingredientTagCategories.length === 0 ? ingredientTagGroups : liveIngredientTagGroups}
          selectedValues={selectedIngredientTags}
          theme={theme}
          title={t.filters.ingredientTags}
          onToggle={(value) => toggleSelection(value, setSelectedIngredientTags)}
        />
      ) : (
        <GroupedFilterGroup
          formatValue={(value) => t.enums.recipeTags[value] ?? t.enums.ingredientTags[value] ?? formatLabel(value)}
          groupLabels={recipeTagGroupLabels}
          groups={ingredientTagCategories.length === 0 ? recipeTagGroups : liveRecipeTagGroups}
          selectedValues={selectedRecipeTags}
          theme={theme}
          title={t.filters.tags}
          onToggle={(value) => toggleSelection(value, setSelectedRecipeTags)}
        />
      )}
    </aside>
  );
}

function toggleSelection<TValue extends string | number>(
  value: TValue,
  setSelectedValues: Dispatch<SetStateAction<TValue[]>>,
) {
  setSelectedValues((selectedValues) =>
    selectedValues.includes(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value],
  );
}

export default BrowserFilterSection;
