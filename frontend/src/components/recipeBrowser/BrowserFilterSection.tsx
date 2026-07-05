import type { Dispatch, SetStateAction } from "react";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { ICuisine } from "../../interfaces/ILookup";
import type { RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { ingredientTags, recipeTags, recipeTypes } from "./formOptions";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserMode } from "./types";

type BrowserFilterSectionProps = {
  mode: BrowserMode;
  cuisines: ICuisine[];
  selectedIngredientTags: IngredientTag[];
  selectedRecipeTypes: RecipeType[];
  selectedRecipeTags: RecipeTag[];
  selectedCuisineIds: number[];
  theme: SiteTheme;
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
  setSelectedIngredientTags,
  setSelectedRecipeTypes,
  setSelectedRecipeTags,
  setSelectedCuisineIds,
}: BrowserFilterSectionProps) {
  return (
    <aside className={recipeBrowserStyles.filterRail(theme)} aria-label={`${mode} filters`}>
      {mode === "ingredients" ? (
        <FilterGroup
          selectedValues={selectedIngredientTags}
          theme={theme}
          title="Ingredient Tags"
          values={ingredientTags}
          onToggle={(value) => toggleSelection(value, setSelectedIngredientTags)}
        />
      ) : (
        <>
          <FilterGroup
            selectedValues={selectedRecipeTypes}
            theme={theme}
            title="Recipe Type"
            values={recipeTypes}
            onToggle={(value) => toggleSelection(value, setSelectedRecipeTypes)}
          />
          <FilterGroup
            selectedValues={selectedRecipeTags}
            theme={theme}
            title="Tags"
            values={recipeTags}
            onToggle={(value) => toggleSelection(value, setSelectedRecipeTags)}
          />
          <NumberFilterGroup
            selectedValues={selectedCuisineIds}
            theme={theme}
            title="Cuisine"
            values={cuisines.map((cuisine) => ({ id: cuisine.cuisineId, label: cuisine.name }))}
            onToggle={(value) => toggleSelection(value, setSelectedCuisineIds)}
          />
        </>
      )}
    </aside>
  );
}

type NumberFilterGroupProps = {
  title: string;
  values: readonly { id: number; label: string }[];
  selectedValues: readonly number[];
  theme: SiteTheme;
  onToggle: (value: number) => void;
};

function NumberFilterGroup({
  title,
  values,
  selectedValues,
  theme,
  onToggle,
}: NumberFilterGroupProps) {
  return (
    <fieldset className={recipeBrowserStyles.filterGroup(theme)}>
      <div className={recipeBrowserStyles.filterGroupHeader}>
        <legend className={recipeBrowserStyles.filterLegend(theme)}>{title}</legend>
      </div>
      <div className={recipeBrowserStyles.filterOptionList}>
        {values.map((value) => (
          <label className={recipeBrowserStyles.checkboxLabel(theme)} key={value.id}>
            <input
              checked={selectedValues.includes(value.id)}
              className={recipeBrowserStyles.checkbox}
              type="checkbox"
              onChange={() => onToggle(value.id)}
            />
            {value.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type FilterGroupProps<TValue extends string> = {
  title: string;
  values: readonly TValue[];
  selectedValues: readonly TValue[];
  theme: SiteTheme;
  onToggle: (value: TValue) => void;
};

function FilterGroup<TValue extends string>({
  title,
  values,
  selectedValues,
  theme,
  onToggle,
}: FilterGroupProps<TValue>) {
  return (
    <fieldset className={recipeBrowserStyles.filterGroup(theme)}>
      <div className={recipeBrowserStyles.filterGroupHeader}>
        <legend className={recipeBrowserStyles.filterLegend(theme)}>{title}</legend>
      </div>
      <div className={recipeBrowserStyles.filterOptionList}>
        {values.map((value) => (
          <label className={recipeBrowserStyles.checkboxLabel(theme)} key={value}>
            <input
              checked={selectedValues.includes(value)}
              className={recipeBrowserStyles.checkbox}
              type="checkbox"
              onChange={() => onToggle(value)}
            />
            {formatLabel(value)}
          </label>
        ))}
      </div>
    </fieldset>
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
