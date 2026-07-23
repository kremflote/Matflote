import type { MeasurementUnit } from "../../interfaces/IIngredient";
import type { IngredientPreparation } from "../../interfaces/IRecipe";

export type SelectedRecipeIngredient = {
  ingredientId: number;
  amount: string;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
};

export type SelectedRecipeComponent = {
  recipeId: number;
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

export function getSelectedRecipeComponent(components: SelectedRecipeComponent[], recipeId: number) {
  return components.find((component) => component.recipeId === recipeId);
}

export function toggleRecipeComponent(components: SelectedRecipeComponent[], recipeId: number) {
  if (components.some((component) => component.recipeId === recipeId)) {
    return components.filter((component) => component.recipeId !== recipeId);
  }

  return [
    ...components,
    {
      recipeId,
      amount: "",
      unit: "Gram" as MeasurementUnit,
      preparation: "None" as IngredientPreparation,
    },
  ];
}

export function updateSelectedRecipeComponent(
  components: SelectedRecipeComponent[],
  recipeId: number,
  value: Partial<Omit<SelectedRecipeComponent, "recipeId">>,
) {
  if (!components.some((component) => component.recipeId === recipeId)) {
    return components;
  }

  return components.map((component) =>
    component.recipeId === recipeId
      ? {
          ...component,
          ...value,
        }
      : component,
  );
}
