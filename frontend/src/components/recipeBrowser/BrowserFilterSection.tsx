import type { Dispatch, SetStateAction } from "react";
import { useLanguage } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { ICuisine } from "../../interfaces/ILookup";
import type { RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { ingredientTagGroups, recipeTagGroups, recipeTypes } from "./formOptions";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import { FilterGroup, GroupedFilterGroup, NumberFilterGroup } from "./BrowserFilterGroups";
import type { BrowserMode } from "./types";

type BrowserFilterSectionProps = {
  mode: BrowserMode;
  cuisines: ICuisine[];
  selectedIngredientTags: IngredientTag[];
  selectedRecipeTypes: RecipeType[];
  selectedRecipeTags: RecipeTag[];
  selectedCuisineIds: number[];
  theme: SiteTheme;
  variant?: "rail" | "panel";
  setSelectedIngredientTags: Dispatch<SetStateAction<IngredientTag[]>>;
  setSelectedRecipeTypes: Dispatch<SetStateAction<RecipeType[]>>;
  setSelectedRecipeTags: Dispatch<SetStateAction<RecipeTag[]>>;
  setSelectedCuisineIds: Dispatch<SetStateAction<number[]>>;
};

function BrowserFilterSection({
  mode,
  cuisines,
  selectedIngredientTags,
  selectedRecipeTypes,
  selectedRecipeTags,
  selectedCuisineIds,
  theme,
  variant = "rail",
  setSelectedIngredientTags,
  setSelectedRecipeTypes,
  setSelectedRecipeTags,
  setSelectedCuisineIds,
}: BrowserFilterSectionProps) {
  const { t } = useLanguage();
  const className = variant === "rail"
    ? recipeBrowserStyles.filterRail(theme)
    : recipeBrowserStyles.filterPanel(theme);

  return (
    <aside className={className} aria-label={t.filters.recipeFilters}>
      {mode === "ingredients" ? (
        <GroupedFilterGroup
          formatValue={(value) => t.enums.ingredientTags[value]}
          groupLabels={t.filters.ingredientTagGroups}
          groups={ingredientTagGroups}
          selectedValues={selectedIngredientTags}
          theme={theme}
          title={t.filters.ingredientTags}
          onToggle={(value) => toggleSelection(value, setSelectedIngredientTags)}
        />
      ) : (
        <>
          <FilterGroup
            formatValue={(value) => t.enums.recipeTypes[value]}
            selectedValues={selectedRecipeTypes}
            theme={theme}
            title={t.filters.recipeType}
            values={recipeTypes}
            onToggle={(value) => toggleSelection(value, setSelectedRecipeTypes)}
          />
          <GroupedFilterGroup
            formatValue={(value) => t.enums.recipeTags[value]}
            groupLabels={t.filters.recipeTagGroups}
            groups={recipeTagGroups}
            selectedValues={selectedRecipeTags}
            theme={theme}
            title={t.filters.tags}
            onToggle={(value) => toggleSelection(value, setSelectedRecipeTags)}
          />
          <NumberFilterGroup
            selectedValues={selectedCuisineIds}
            theme={theme}
            title={t.filters.cuisine}
            values={cuisines.map((cuisine) => ({ id: cuisine.cuisineId, label: cuisine.name }))}
            onToggle={(value) => toggleSelection(value, setSelectedCuisineIds)}
          />
        </>
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
