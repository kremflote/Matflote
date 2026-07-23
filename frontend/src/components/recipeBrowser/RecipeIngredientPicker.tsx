import IngredientThumbnail from "../IngredientThumbnail";
import Modal from "../Modal";
import RecipeLineThumbnail from "../RecipeLineThumbnail";
import { useLanguage } from "../../contexts";
import type { IIngredient, MeasurementUnit } from "../../interfaces/IIngredient";
import type { IRecipe, IngredientPreparation } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { ingredientPreparations, measurementUnits } from "./formOptions";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import {
  getSelectedIngredient,
  getSelectedRecipeComponent,
  type SelectedRecipeComponent,
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
  const { t } = useLanguage();

  return (
    <>
      <input
        className={recipeBrowserStyles.textField(theme)}
        placeholder={t.cookbook.searchIngredientsPlaceholder}
        type="search"
        value={ingredientSearch}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className={`${recipeBrowserStyles.recipeIngredientPickerGrid} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}>
        {ingredients.length === 0 ? (
          <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.noIngredientsFound}</p>
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
              measurementLabels={t.enums.measurementUnits}
              amountPlaceholder={t.cookbook.amount}
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
  measurementLabels: Record<MeasurementUnit, string>;
  amountPlaceholder: string;
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
  measurementLabels,
  amountPlaceholder,
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
          placeholder={amountPlaceholder}
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
              {measurementLabels[value]}
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
  const { t } = useLanguage();

  if (selectedIngredients.length === 0) {
    return <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.noIngredientsSelected}</p>;
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
              {t.cookbook.ingredientSingular}
            </span>
          ) : (
            <div
              className={recipeBrowserStyles.selectedIngredientSummaryItem(theme)}
              key={selectedIngredient.ingredientId}
            >
              <IngredientThumbnail
                className={recipeBrowserStyles.selectedIngredientThumbnail}
                ingredient={ingredient}
                mode="compact"
                theme={theme}
              />
              <span className={recipeBrowserStyles.selectedIngredientMeta(theme)}>
                <span>{formatSelectedIngredientAmount(selectedIngredient.amount, selectedIngredient.unit, t.enums.measurementUnits)}</span>
                {selectedIngredient.preparation !== "None" && (
                  <span>{t.enums.ingredientPreparations[selectedIngredient.preparation]}</span>
                )}
              </span>
            </div>
          )
        );
      })}
    </div>
  );
}

type RecipeComponentPickerContentProps = {
  preparationLabels: Record<IngredientPreparation, string>;
  recipes: IRecipe[];
  recipeSearch: string;
  selectedComponentIds: number[];
  selectedComponents: SelectedRecipeComponent[];
  theme: SiteTheme;
  onAmountChange: (recipeId: number, value: string) => void;
  onPreparationChange: (recipeId: number, value: IngredientPreparation) => void;
  onSearchChange: (value: string) => void;
  onToggle: (recipeId: number) => void;
  onUnitChange: (recipeId: number, value: MeasurementUnit) => void;
};

export function RecipeComponentPickerContent({
  preparationLabels,
  recipes,
  recipeSearch,
  selectedComponentIds,
  selectedComponents,
  theme,
  onAmountChange,
  onPreparationChange,
  onSearchChange,
  onToggle,
  onUnitChange,
}: RecipeComponentPickerContentProps) {
  const { t } = useLanguage();

  return (
    <>
      <input
        className={recipeBrowserStyles.textField(theme)}
        placeholder={t.cookbook.searchRecipes}
        type="search"
        value={recipeSearch}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className={`${recipeBrowserStyles.recipeIngredientPickerGrid} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}>
        {recipes.length === 0 ? (
          <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.noRecipesFound}</p>
        ) : (
          recipes.map((recipe) => {
            const selectedComponent = getSelectedRecipeComponent(selectedComponents, recipe.recipeId);
            const selected = selectedComponentIds.includes(recipe.recipeId);

            return (
              <RecipeComponentPickerRow
                amount={selectedComponent?.amount ?? ""}
                amountPlaceholder={t.cookbook.amount}
                key={recipe.recipeId}
                measurementLabels={t.enums.measurementUnits}
                preparation={selectedComponent?.preparation ?? "None"}
                preparationLabels={preparationLabels}
                recipe={recipe}
                recipeTypeLabel={t.enums.recipeTypes[recipe.recipeType]}
                selected={selected}
                theme={theme}
                unit={selectedComponent?.unit ?? "Gram"}
                onAmountChange={(amount) => onAmountChange(recipe.recipeId, amount)}
                onPreparationChange={(preparation) => onPreparationChange(recipe.recipeId, preparation)}
                onToggle={() => onToggle(recipe.recipeId)}
                onUnitChange={(unit) => onUnitChange(recipe.recipeId, unit)}
              />
            );
          })
        )}
      </div>
    </>
  );
}

type RecipeComponentPickerRowProps = {
  amount: string;
  amountPlaceholder: string;
  measurementLabels: Record<MeasurementUnit, string>;
  preparation: IngredientPreparation;
  preparationLabels: Record<IngredientPreparation, string>;
  recipe: IRecipe;
  recipeTypeLabel: string;
  selected: boolean;
  theme: SiteTheme;
  unit: MeasurementUnit;
  onAmountChange: (value: string) => void;
  onPreparationChange: (value: IngredientPreparation) => void;
  onToggle: () => void;
  onUnitChange: (value: MeasurementUnit) => void;
};

function RecipeComponentPickerRow({
  amount,
  amountPlaceholder,
  measurementLabels,
  preparation,
  preparationLabels,
  recipe,
  recipeTypeLabel,
  selected,
  theme,
  unit,
  onAmountChange,
  onPreparationChange,
  onToggle,
  onUnitChange,
}: RecipeComponentPickerRowProps) {
  return (
    <div className={recipeBrowserStyles.recipeIngredientPickerRow}>
      <input
        aria-label={`Select ${recipe.name}`}
        checked={selected}
        className={recipeBrowserStyles.checkbox}
        type="checkbox"
        onChange={onToggle}
      />
      <RecipeLineThumbnail
        className={recipeBrowserStyles.recipeIngredientThumbnailCompact}
        recipe={{
          imageUrl: recipe.imageUrl,
          name: recipe.name,
          subtitle: recipeTypeLabel,
        }}
        mode="compact"
        selected={selected}
        theme={theme}
        onClick={onToggle}
      />
      <div className={recipeBrowserStyles.recipeIngredientControlGrid}>
        <input
          aria-label={`${recipe.name} amount`}
          className={recipeBrowserStyles.compactTextField(theme)}
          disabled={!selected}
          min="0.01"
          placeholder={amountPlaceholder}
          step="0.01"
          type="number"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <select
          aria-label={`${recipe.name} unit`}
          className={recipeBrowserStyles.compactTextField(theme)}
          disabled={!selected}
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as MeasurementUnit)}
        >
          {measurementUnits.map((value) => (
            <option key={value} value={value}>
              {measurementLabels[value]}
            </option>
          ))}
        </select>
        <select
          aria-label={`${recipe.name} preparation`}
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

type SelectedRecipeComponentCapsulesProps = {
  recipes: IRecipe[];
  selectedComponents: SelectedRecipeComponent[];
  theme: SiteTheme;
};

export function SelectedRecipeComponentCapsules({
  recipes,
  selectedComponents,
  theme,
}: SelectedRecipeComponentCapsulesProps) {
  const { t } = useLanguage();

  if (selectedComponents.length === 0) {
    return <p className={recipeBrowserStyles.helperText(theme)}>{t.cookbook.noRecipesSelected}</p>;
  }

  return (
    <div className={recipeBrowserStyles.selectedIngredientCapsules}>
      {selectedComponents.map((selectedComponent) => {
        const recipe = recipes.find((currentRecipe) => currentRecipe.recipeId === selectedComponent.recipeId);

        return (
          <div
            className={recipeBrowserStyles.selectedIngredientSummaryItem(theme)}
            key={selectedComponent.recipeId}
          >
            <RecipeLineThumbnail
              className={recipeBrowserStyles.selectedIngredientThumbnail}
              recipe={{
                imageUrl: recipe?.imageUrl ?? null,
                name: recipe?.name ?? t.cookbook.recipeSingular,
                subtitle: recipe === undefined ? "" : t.enums.recipeTypes[recipe.recipeType],
              }}
              mode="compact"
              theme={theme}
            />
            <span className={recipeBrowserStyles.selectedIngredientMeta(theme)}>
              <span>{formatSelectedIngredientAmount(selectedComponent.amount, selectedComponent.unit, t.enums.measurementUnits)}</span>
              {selectedComponent.preparation !== "None" && (
                <span>{t.enums.ingredientPreparations[selectedComponent.preparation]}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatSelectedIngredientAmount(
  amount: string,
  unit: MeasurementUnit,
  unitLabels: Record<MeasurementUnit, string>,
) {
  const trimmedAmount = amount.trim();
  return trimmedAmount.length === 0 ? unitLabels[unit] : `${trimmedAmount} ${unitLabels[unit].toLowerCase()}`;
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
  const { t } = useLanguage();

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
      closeLabel={closeLabel}
      footer={
        <>
          <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onCancel}>
            {t.common.cancel}
          </button>
          <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onConfirm}>
            {t.common.confirm}
          </button>
        </>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title={t.cookbook.ingredients}
      titleClassName={recipeBrowserStyles.modalTitle}
      onClose={onCancel}
    >
      <RecipeIngredientPickerContent theme={theme} {...contentProps} />
    </Modal>
  );
}
