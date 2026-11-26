// What the recipe form sends: the checks before saving and the request built from the form's text fields.

import type { TranslationDictionary } from "../../i18n/types";
import type { RecipeTag } from "../../interfaces/IRecipe";
import type { RecipeRequest } from "../../services/recipeService";
import { parseOptionalNumber } from "../../utils/formValues";
import type { SelectedRecipeComponent, SelectedRecipeIngredient } from "./recipeIngredientSelection";

export const RECIPE_NAME_MAX_LENGTH = 30;

export type RecipeFormValues = {
  name: string;
  portions: string;
  description: string;
  instructions: string;
  selectedIngredients: SelectedRecipeIngredient[];
  selectedComponents: SelectedRecipeComponent[];
  selectedTags: RecipeTag[];
};

/** The first thing that stops the form from being saved, as the message to show, or null. */
export function checkRecipeForm(values: RecipeFormValues, t: TranslationDictionary): string | null {
  const trimmedName = values.name.trim();
  if (trimmedName.length === 0) {
    return t.cookbook.recipeNeedsName;
  }

  if (trimmedName.length > RECIPE_NAME_MAX_LENGTH) {
    return t.cookbook.recipeNameTooLong(RECIPE_NAME_MAX_LENGTH);
  }

  if (values.selectedIngredients.length === 0 && values.selectedComponents.length === 0) {
    return t.cookbook.chooseAtLeastOneIngredient;
  }

  const portions = parseOptionalNumber(values.portions);
  if (portions === null || portions <= 0) {
    return t.cookbook.portionsRequired;
  }

  if (values.selectedComponents.some((component) => {
    const amount = parseOptionalNumber(component.amount);
    return amount === null || amount <= 0;
  })) {
    return t.cookbook.recipeComponentAmountRequired;
  }

  return null;
}

/** The request for a form that passed checkRecipeForm. */
export function buildRecipeRequest(values: RecipeFormValues, imageUrl: string | null): RecipeRequest {
  return {
    name: values.name.trim(),
    imageUrl,
    description: nullableText(values.description),
    instructions: nullableText(values.instructions),
    portions: parseOptionalNumber(values.portions) ?? 1,
    ingredients: values.selectedIngredients.map((ingredient) => ({
      ingredientId: ingredient.ingredientId,
      amount: parseOptionalNumber(ingredient.amount),
      unit: ingredient.unit,
      preparation: ingredient.preparation,
    })),
    tags: values.selectedTags,
    components: values.selectedComponents.map((component, index) => ({
      recipeId: component.recipeId,
      amount: parseOptionalNumber(component.amount) ?? 0,
      unit: component.unit,
      preparation: component.preparation,
      sortOrder: index + 1,
    })),
  };
}

function nullableText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? null : trimmedValue;
}
