import IngredientThumbnail from "../IngredientThumbnail";
import Modal from "../Modal";
import type { IIngredient, MeasurementUnit } from "../../interfaces/IIngredient";
import type { IngredientPreparation } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { ingredientPreparations, measurementUnits } from "./formOptions";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import {
  getSelectedIngredient,
  type SelectedRecipeIngredient,
} from "./recipeIngredientSelection";

type RecipeIngredientPickerContentProps = {
  ingredientSearch: string;
  ingredients: IIngredient[];
  preparationLabels: Record<IngredientPreparation, string>;
  selectedIngredientIds: number[];
  selectedIngredients: SelectedRecipeIngredient[];
  theme: SiteTheme;
  onAmountChange: (ingredientId: number, value: string) => void;
  onPreparationChange: (ingredientId: number, value: IngredientPreparation) => void;
  onSearchChange: (value: string) => void;
  onToggle: (ingredientId: number) => void;
  onUnitChange: (ingredientId: number, value: MeasurementUnit) => void;
};

export function RecipeIngredientPickerContent({
  ingredientSearch,
  ingredients,
  preparationLabels,
  selectedIngredientIds,
  selectedIngredients,
  theme,
  onAmountChange,
  onPreparationChange,
  onSearchChange,
  onToggle,
  onUnitChange,
}: RecipeIngredientPickerContentProps) {
  return (
    <>
      <input
        className={recipeBrowserStyles.textField(theme)}
        placeholder="search ingredients..."
        type="search"
        value={ingredientSearch}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className={`${recipeBrowserStyles.recipeIngredientPickerGrid} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}>
        {ingredients.length === 0 ? (
          <p className={recipeBrowserStyles.helperText(theme)}>No ingredients found.</p>
        ) : (
          ingredients.map((ingredient) => (
            <RecipeIngredientPickerRow
              amount={getSelectedIngredient(selectedIngredients, ingredient.ingredientId)?.amount ?? ""}
              ingredient={ingredient}
              key={ingredient.ingredientId}
              selected={selectedIngredientIds.includes(ingredient.ingredientId)}
              theme={theme}
              unit={getSelectedIngredient(selectedIngredients, ingredient.ingredientId)?.unit ?? "Gram"}
              preparation={getSelectedIngredient(selectedIngredients, ingredient.ingredientId)?.preparation ?? "None"}
              preparationLabels={preparationLabels}
              onAmountChange={(amount) => onAmountChange(ingredient.ingredientId, amount)}
              onPreparationChange={(preparation) => onPreparationChange(ingredient.ingredientId, preparation)}
              onToggle={() => onToggle(ingredient.ingredientId)}
              onUnitChange={(unit) => onUnitChange(ingredient.ingredientId, unit)}
            />
          ))
        )}
      </div>
    </>
  );
}

type RecipeIngredientPickerRowProps = {
  amount: string;
  ingredient: IIngredient;
  selected: boolean;
  preparation: IngredientPreparation;
  preparationLabels: Record<IngredientPreparation, string>;
  theme: SiteTheme;
  unit: MeasurementUnit;
  onAmountChange: (value: string) => void;
  onPreparationChange: (value: IngredientPreparation) => void;
  onToggle: () => void;
  onUnitChange: (value: MeasurementUnit) => void;
};

function RecipeIngredientPickerRow({
  amount,
  ingredient,
  preparation,
  preparationLabels,
  selected,
  theme,
  unit,
  onAmountChange,
  onPreparationChange,
  onToggle,
  onUnitChange,
}: RecipeIngredientPickerRowProps) {
  return (
    <div className={recipeBrowserStyles.recipeIngredientPickerRow}>
      <input
        aria-label={`Select ${ingredient.ingredientName}`}
        checked={selected}
        className={recipeBrowserStyles.checkbox}
        type="checkbox"
        onChange={onToggle}
      />
      <IngredientThumbnail
        className={recipeBrowserStyles.recipeIngredientThumbnailCompact}
        ingredient={ingredient}
        mode="compact"
        selected={selected}
        selectedPresentation="colorBorder"
        theme={theme}
        onClick={onToggle}
      />
      <div className={recipeBrowserStyles.recipeIngredientControlGrid}>
        <input
          aria-label={`${ingredient.ingredientName} amount`}
          className={recipeBrowserStyles.compactTextField(theme)}
          disabled={!selected}
          min="0"
          placeholder="amount"
          step="0.01"
          type="number"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <select
          aria-label={`${ingredient.ingredientName} unit`}
          className={recipeBrowserStyles.compactTextField(theme)}
          disabled={!selected}
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as MeasurementUnit)}
        >
          {measurementUnits.map((value) => (
            <option key={value} value={value}>
              {formatLabel(value)}
            </option>
          ))}
        </select>
        <select
          aria-label={`${ingredient.ingredientName} preparation`}
          className={`${recipeBrowserStyles.compactTextField(theme)} ${recipeBrowserStyles.recipeIngredientPreparationField}`}
          disabled={!selected}
          value={preparation}
          onChange={(event) => onPreparationChange(event.target.value as IngredientPreparation)}
        >
          {ingredientPreparations.map((value) => (
            <option key={value} value={value}>
              {preparationLabels[value]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type SelectedIngredientCapsulesProps = {
  ingredients: IIngredient[];
  selectedIngredients: SelectedRecipeIngredient[];
  theme: SiteTheme;
};

export function SelectedIngredientCapsules({ ingredients, selectedIngredients, theme }: SelectedIngredientCapsulesProps) {
  if (selectedIngredients.length === 0) {
    return <p className={recipeBrowserStyles.helperText(theme)}>No ingredients selected.</p>;
  }

  return (
    <div className={recipeBrowserStyles.selectedIngredientCapsules}>
      {selectedIngredients.map((selectedIngredient) => {
        const ingredient = ingredients.find((currentIngredient) => currentIngredient.ingredientId === selectedIngredient.ingredientId);

        return (
          ingredient === undefined ? (
            <span
              className={recipeBrowserStyles.selectedIngredientCapsule(theme)}
              key={selectedIngredient.ingredientId}
            >
              Ingredient
            </span>
          ) : (
            <IngredientThumbnail
              className={recipeBrowserStyles.selectedIngredientThumbnail}
              ingredient={ingredient}
              mode="compact"
              key={selectedIngredient.ingredientId}
              theme={theme}
            />
          )
        );
      })}
    </div>
  );
}

type RecipeIngredientPickerDialogProps = RecipeIngredientPickerContentProps & {
  onCancel: () => void;
  onConfirm: () => void;
  closeLabel: string;
};

export function RecipeIngredientPickerDialog({
  closeLabel,
  theme,
  onCancel,
  onConfirm,
  ...contentProps
}: RecipeIngredientPickerDialogProps) {
  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
      closeLabel={closeLabel}
      footer={
        <>
          <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onConfirm}>
            Confirm
          </button>
        </>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title="Ingredients"
      titleClassName={recipeBrowserStyles.modalTitle}
      onClose={onCancel}
    >
      <RecipeIngredientPickerContent theme={theme} {...contentProps} />
    </Modal>
  );
}
