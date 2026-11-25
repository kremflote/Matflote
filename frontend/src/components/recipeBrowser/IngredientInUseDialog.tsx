import { useId, useMemo, useState } from "react";
import { useLanguage } from "../../contexts";
import type { IIngredient, IIngredientInUse } from "../../interfaces/IIngredient";
import { ingredientService } from "../../services";
import { controlStyles, type SiteTheme } from "../../styles/appStyles";
import { confirmationDialogStyles } from "../../styles/confirmationDialogStyles";
import { parseDateInputValue } from "../../utils/plannerDate";
import ConfirmationDialog from "../ConfirmationDialog";

type IngredientInUseDialogProps = {
  ingredient: IIngredient;
  ingredients: IIngredient[];
  uses: IIngredientInUse;
  theme: SiteTheme;
  onCancel: () => void;
  /** Called after the uses were moved and the ingredient removed. */
  onReplaced: () => void | Promise<void>;
};

/**
 * Shown when an ingredient cannot be removed because recipes or planned meals use it (AUDIT B1):
 * lists the uses and offers to move them to another ingredient, which removes this one.
 */
function IngredientInUseDialog({ ingredient, ingredients, uses, theme, onCancel, onReplaced }: IngredientInUseDialogProps) {
  const { t } = useLanguage();
  const selectId = useId();
  const [replacementId, setReplacementId] = useState<number | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const candidates = useMemo(
    () =>
      ingredients
        .filter((candidate) => candidate.ingredientId !== ingredient.ingredientId)
        .sort((first, second) => first.ingredientName.localeCompare(second.ingredientName, t.locale)),
    [ingredient.ingredientId, ingredients, t.locale],
  );
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(t.locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    [t.locale],
  );

  const formatMealDate = (value: string) => {
    const date = parseDateInputValue(value);
    return date === null ? value : dateFormat.format(date);
  };

  const replace = async () => {
    if (replacementId === null) {
      return;
    }

    setIsReplacing(true);
    setError(null);
    try {
      await ingredientService.replaceWith(ingredient.ingredientId, replacementId);
      await onReplaced();
    } catch (caughtError) {
      setError(caughtError instanceof Error && caughtError.message.trim().length > 0
        ? caughtError.message
        : t.cookbook.couldNotReplaceIngredient);
      setIsReplacing(false);
    }
  };

  const listClassName = "mt-1 grid max-h-40 list-disc gap-1 overflow-y-auto pl-5";
  return (
    <ConfirmationDialog
      body={
        <div className="grid gap-3">
          <p>{t.cookbook.ingredientInUseBody(uses.recipes.length, uses.mealPlanEntries.length)}</p>
          {uses.recipes.length > 0 && (
            <div>
              <p className={confirmationDialogStyles.fieldTitle(theme)}>{t.cookbook.ingredientInUseRecipes}</p>
              <ul className={listClassName}>
                {uses.recipes.map((recipe) => (
                  <li key={recipe.recipeId}>{recipe.name}</li>
                ))}
              </ul>
            </div>
          )}
          {uses.mealPlanEntries.length > 0 && (
            <div>
              <p className={confirmationDialogStyles.fieldTitle(theme)}>{t.cookbook.ingredientInUseMeals}</p>
              <ul className={listClassName}>
                {uses.mealPlanEntries.map((meal) => (
                  <li key={meal.mealPlanEntryId}>
                    {formatMealDate(meal.date)}, {t.enums.mealSlots[meal.slot].toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <label className={confirmationDialogStyles.fieldLabel} htmlFor={selectId}>
            <span className={confirmationDialogStyles.fieldTitle(theme)}>{t.cookbook.replaceWith}</span>
            <select
              className={controlStyles.formField(theme)}
              disabled={isReplacing}
              id={selectId}
              value={replacementId ?? ""}
              onChange={(event) => setReplacementId(event.target.value === "" ? null : Number(event.target.value))}
            >
              <option value="">{t.cookbook.replaceWithPlaceholder}</option>
              {candidates.map((candidate) => (
                <option key={candidate.ingredientId} value={candidate.ingredientId}>
                  {candidate.brand === null ? candidate.ingredientName : `${candidate.ingredientName} (${candidate.brand.name})`}
                </option>
              ))}
            </select>
          </label>
          <p className={confirmationDialogStyles.fieldHelp(theme)}>{t.cookbook.replaceWithHelp}</p>
          {error !== null && <p role="alert">{error}</p>}
        </div>
      }
      confirmLabel={t.cookbook.replaceAndRemove}
      isBusy={isReplacing}
      isConfirmDisabled={replacementId === null}
      theme={theme}
      title={t.cookbook.ingredientInUseTitle(ingredient.ingredientName)}
      onCancel={onCancel}
      onConfirm={() => void replace()}
    />
  );
}

export default IngredientInUseDialog;
