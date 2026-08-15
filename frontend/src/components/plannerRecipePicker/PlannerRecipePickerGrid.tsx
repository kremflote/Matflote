import { useState } from "react";
import { useLanguage } from "../../contexts";
import type { IIngredient, MeasurementUnit } from "../../interfaces/IIngredient";
import type { IRecipe } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { plannerPickerStyles } from "../../styles/appStyles";
import IngredientThumbnail from "../IngredientThumbnail";
import RecipeThumbnail from "../RecipeThumbnail";
import { measurementUnits } from "../recipeBrowser/formOptions";

type PlannerRecipePickerGridProps = {
  browserMode: "recipes" | "ingredients";
  defaultToppingTagName: string;
  ingredients: IIngredient[];
  recipes: IRecipe[];
  selectedIngredients: SelectedIngredientValue[];
  selectedRecipes: SelectedRecipeValue[];
  theme: SiteTheme;
  onSelectIngredient: (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => void;
  onSelectRecipe: (recipe: IRecipe, portions: number) => void;
  onUpdateIngredient: (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => void;
  onUpdateRecipe: (recipe: IRecipe, portions: number) => void;
};

type ActiveOverlay =
  | { kind: "recipe"; id: number; value: string }
  | { kind: "ingredient"; id: number; value: string; unit: MeasurementUnit };

type SelectedRecipeValue = {
  recipeId: number;
  portions: number;
};

type SelectedIngredientValue = {
  ingredientId: number;
  amount: number;
  unit: MeasurementUnit;
};

function PlannerRecipePickerGrid({
  browserMode,
  defaultToppingTagName,
  ingredients,
  recipes,
  selectedIngredients,
  selectedRecipes,
  theme,
  onSelectIngredient,
  onSelectRecipe,
  onUpdateIngredient,
  onUpdateRecipe,
}: PlannerRecipePickerGridProps) {
  const { t } = useLanguage();
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay | null>(null);
  const isEmpty = browserMode === "recipes" ? recipes.length === 0 : ingredients.length === 0;
  const selectedRecipeById = new Map(selectedRecipes.map((selection) => [selection.recipeId, selection]));
  const selectedIngredientById = new Map(selectedIngredients.map((selection) => [selection.ingredientId, selection]));

  if (isEmpty) {
    return (
      <div className={plannerPickerStyles.emptyState(theme)}>
        {browserMode === "recipes" ? t.planner.noMatchingRecipesFound : t.browser.noIngredientsFound}
      </div>
    );
  }

  return (
    <div className={browserMode === "recipes" ? plannerPickerStyles.recipeGrid : plannerPickerStyles.ingredientGrid}>
      {browserMode === "recipes"
        ? recipes.map((recipe) => {
          const selectedRecipe = selectedRecipeById.get(recipe.recipeId);
          const selected = selectedRecipe !== undefined;
          const isActive = activeOverlay?.kind === "recipe" && activeOverlay.id === recipe.recipeId;
          const visuallySelected = selected || isActive;
          const defaultValue = (selectedRecipe?.portions ?? recipe.portions).toString();
          const value = isActive ? activeOverlay.value : defaultValue;

          return (
            <div className={plannerPickerStyles.pickerCardShell} key={recipe.recipeId}>
              <RecipeThumbnail
                ariaPressed={visuallySelected}
                className={plannerPickerStyles.recipeCard(theme, visuallySelected)}
                recipe={{
                  imageUrl: recipe.imageUrl,
                  name: recipe.name,
                  subtitle: recipe.tags.slice(0, 2).join(" · "),
                }}
                interactiveEffect={false}
                theme={theme}
                onClick={() => {
                  const nextPortions = parsePositiveNumber(value) ?? recipe.portions;
                  if (selected) {
                    onSelectRecipe(recipe, nextPortions);
                    setActiveOverlay(null);
                    return;
                  }

                  onSelectRecipe(recipe, nextPortions);
                  setActiveOverlay({ kind: "recipe", id: recipe.recipeId, value: nextPortions.toString() });
                }}
              />
              {isActive ? (
                <div className={plannerPickerStyles.pickerFloatingControls}>
                  <PickerInlineControls
                    inputLabel={t.cookbook.portions}
                    theme={theme}
                    value={value}
                    onValueChange={(nextValue) => {
                      setActiveOverlay({ kind: "recipe", id: recipe.recipeId, value: nextValue });
                      const portions = parsePositiveNumber(nextValue);
                      if (portions !== null) {
                        onUpdateRecipe(recipe, portions);
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })
        : ingredients.map((ingredient) => {
          const selectedIngredient = selectedIngredientById.get(ingredient.ingredientId);
          const selected = selectedIngredient !== undefined;
          const isActive = activeOverlay?.kind === "ingredient" && activeOverlay.id === ingredient.ingredientId;
          const visuallySelected = selected || isActive;
          const defaultAmount = getDefaultIngredientAmount(ingredient, defaultToppingTagName);
          const defaultValue = (selectedIngredient?.amount ?? defaultAmount).toString();
          const defaultUnit = selectedIngredient?.unit ?? "Gram";
          const value = isActive ? activeOverlay.value : defaultValue;
          const unit = isActive ? activeOverlay.unit : defaultUnit;

          return (
            <div
              className={plannerPickerStyles.pickerIngredientCard(theme, visuallySelected)}
              key={ingredient.ingredientId}
            >
              <IngredientThumbnail
                className={plannerPickerStyles.pickerIngredientThumbnail}
                ingredient={ingredient}
                theme={theme}
                onClick={() => {
                  const nextAmount = parsePositiveNumber(value) ?? defaultAmount;
                  if (selected) {
                    onSelectIngredient(ingredient, nextAmount, unit);
                    setActiveOverlay(null);
                    return;
                  }

                  onSelectIngredient(ingredient, nextAmount, unit);
                  setActiveOverlay({
                    kind: "ingredient",
                    id: ingredient.ingredientId,
                    value: nextAmount.toString(),
                    unit,
                  });
                }}
              />
              {isActive ? (
                <div className={plannerPickerStyles.pickerIngredientControls}>
                  <PickerInlineControls
                    inputLabel={t.cookbook.amount}
                    theme={theme}
                    unit={unit}
                    value={value}
                    onUnitChange={(nextUnit) => {
                      setActiveOverlay({ kind: "ingredient", id: ingredient.ingredientId, value, unit: nextUnit });
                      const amount = parsePositiveNumber(value);
                      if (amount !== null) {
                        onUpdateIngredient(ingredient, amount, nextUnit);
                      }
                    }}
                    onValueChange={(nextValue) => {
                      setActiveOverlay({ kind: "ingredient", id: ingredient.ingredientId, value: nextValue, unit });
                      const amount = parsePositiveNumber(nextValue);
                      if (amount !== null) {
                        onUpdateIngredient(ingredient, amount, unit);
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}

type PickerOverlayProps = {
  inputLabel: string;
  theme: SiteTheme;
  unit?: MeasurementUnit;
  value: string;
  onUnitChange?: (unit: MeasurementUnit) => void;
  onValueChange: (value: string) => void;
};

function PickerInlineControls({
  inputLabel,
  theme,
  unit,
  value,
  onUnitChange,
  onValueChange,
}: PickerOverlayProps) {
  return (
    <div className={plannerPickerStyles.pickerInlineControls}>
      <label className={plannerPickerStyles.pickerInlineLabel}>
        <span className="sr-only">{inputLabel}</span>
        <input
          className={plannerPickerStyles.pickerOverlayInput(theme)}
          min="0"
          step="0.25"
          type="number"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </label>
      {unit !== undefined && onUnitChange !== undefined && (
        <select
          className={plannerPickerStyles.pickerOverlayUnitSelect(theme)}
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as MeasurementUnit)}
        >
          {measurementUnits.map((measurementUnit) => (
            <option key={measurementUnit} value={measurementUnit}>
              {measurementUnit}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getDefaultIngredientAmount(ingredient: IIngredient, defaultToppingTagName: string) {
  return ingredient.tags.includes(defaultToppingTagName) ? 20 : 1;
}

export default PlannerRecipePickerGrid;
