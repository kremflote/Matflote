import type { MeasurementUnit } from "../../interfaces/IIngredient";
import type { IngredientPreparation } from "../../interfaces/IRecipe";

export type SelectedRecipeIngredient = {
  ingredientId: number;
  amount: string;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
};

export function getSelectedIngredient(ingredients: SelectedRecipeIngredient[], ingredientId: number) {
  return ingredients.find((ingredient) => ingredient.ingredientId === ingredientId);
}

export function toggleRecipeIngredient(ingredients: SelectedRecipeIngredient[], ingredientId: number) {
  if (ingredients.some((ingredient) => ingredient.ingredientId === ingredientId)) {
    return ingredients.filter((ingredient) => ingredient.ingredientId !== ingredientId);
  }

  return [
    ...ingredients,
    {
      ingredientId,
      amount: "",
      unit: "Gram" as MeasurementUnit,
      preparation: "None" as IngredientPreparation,
    },
  ];
}

export function updateSelectedIngredient(
  ingredients: SelectedRecipeIngredient[],
  ingredientId: number,
  value: Partial<Omit<SelectedRecipeIngredient, "ingredientId">>,
) {
  if (!ingredients.some((ingredient) => ingredient.ingredientId === ingredientId)) {
    return ingredients;
  }

  return ingredients.map((ingredient) =>
    ingredient.ingredientId === ingredientId
      ? {
          ...ingredient,
          ...value,
        }
      : ingredient,
  );
}
