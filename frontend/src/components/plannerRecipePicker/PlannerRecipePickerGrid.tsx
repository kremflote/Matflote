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
  ingredients: IIngredient[];
  recipes: IRecipe[];
  selectedIngredientIds: number[];
  selectedRecipeIds: number[];
  theme: SiteTheme;
  onAddIngredient: (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => void;
  onAddRecipe: (recipe: IRecipe, portions: number) => void;
  onRemoveIngredient: (ingredientId: number) => void;
  onRemoveRecipe: (recipeId: number) => void;
};

type ActiveOverlay =
  | { kind: "recipe"; id: number; value: string }
  | { kind: "ingredient"; id: number; value: string; unit: MeasurementUnit };

function PlannerRecipePickerGrid({
  browserMode,
  ingredients,
  recipes,
  selectedIngredientIds,
  selectedRecipeIds,
  theme,
  onAddIngredient,
  onAddRecipe,
  onRemoveIngredient,
  onRemoveRecipe,
}: PlannerRecipePickerGridProps) {
  const { t } = useLanguage();
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay | null>(null);
  const isEmpty = browserMode === "recipes" ? recipes.length === 0 : ingredients.length === 0;

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
          const selected = selectedRecipeIds.includes(recipe.recipeId);
          const isActive = activeOverlay?.kind === "recipe" && activeOverlay.id === recipe.recipeId;
          const visuallySelected = selected || isActive;
          const value = isActive ? activeOverlay.value : recipe.portions.toString();

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
                onClick={
                  isActive
                    ? undefined
                    : selected
                      ? () => onRemoveRecipe(recipe.recipeId)
                      : () => setActiveOverlay({ kind: "recipe", id: recipe.recipeId, value })
                }
              />
              {isActive ? (
                <div className={plannerPickerStyles.pickerFloatingControls}>
                  <PickerInlineControls
                    inputLabel={t.cookbook.portions}
                    theme={theme}
                    value={value}
                    onAdd={() => {
                      const portions = parsePositiveNumber(value);
                      if (portions !== null) {
                        onAddRecipe(recipe, portions);
                        setActiveOverlay(null);
                      }
                    }}
                    onValueChange={(nextValue) => setActiveOverlay({ kind: "recipe", id: recipe.recipeId, value: nextValue })}
                  />
                </div>
              ) : null}
            </div>
          );
        })
        : ingredients.map((ingredient) => {
          const selected = selectedIngredientIds.includes(ingredient.ingredientId);
          const isActive = activeOverlay?.kind === "ingredient" && activeOverlay.id === ingredient.ingredientId;
          const visuallySelected = selected || isActive;
          const value = isActive ? activeOverlay.value : "1";
          const unit = isActive ? activeOverlay.unit : "Gram";

          return (
            <div
              className={plannerPickerStyles.pickerIngredientCard(theme, visuallySelected)}
              key={ingredient.ingredientId}
            >
              <IngredientThumbnail
                className={plannerPickerStyles.pickerIngredientThumbnail}
                ingredient={ingredient}
                theme={theme}
                onClick={
                  isActive
                    ? undefined
                    : selected
                      ? () => onRemoveIngredient(ingredient.ingredientId)
                      : () => setActiveOverlay({ kind: "ingredient", id: ingredient.ingredientId, value, unit })
                }
              />
              {isActive ? (
                <div className={plannerPickerStyles.pickerIngredientControls}>
                  <PickerInlineControls
                    inputLabel={t.cookbook.amount}
                    theme={theme}
                    unit={unit}
                    value={value}
                    onAdd={() => {
                      const amount = parsePositiveNumber(value);
                      if (amount !== null) {
                        onAddIngredient(ingredient, amount, unit);
                        setActiveOverlay(null);
                      }
                    }}
                    onUnitChange={(nextUnit) => setActiveOverlay({ kind: "ingredient", id: ingredient.ingredientId, value, unit: nextUnit })}
                    onValueChange={(nextValue) => setActiveOverlay({ kind: "ingredient", id: ingredient.ingredientId, value: nextValue, unit })}
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
  onAdd: () => void;
  onUnitChange?: (unit: MeasurementUnit) => void;
  onValueChange: (value: string) => void;
};

function PickerInlineControls({
  inputLabel,
  theme,
  unit,
  value,
  onAdd,
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
      <button className={plannerPickerStyles.pickerOverlayAddButton(theme)} type="button" onClick={onAdd}>
        +
      </button>
    </div>
  );
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default PlannerRecipePickerGrid;
