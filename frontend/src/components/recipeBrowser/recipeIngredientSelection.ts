import type { MeasurementUnit } from "../../interfaces/IIngredient";
import type { IRecipe, IngredientPreparation } from "../../interfaces/IRecipe";

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

export function toggleRecipeComponent(components: SelectedRecipeComponent[], recipe: IRecipe) {
  const recipeId = recipe.recipeId;

  if (components.some((component) => component.recipeId === recipeId)) {
    return components.filter((component) => component.recipeId !== recipeId);
  }

  const naturalAmount = getNaturalRecipeComponentAmount(recipe);

  return [
    ...components,
    {
      recipeId,
      amount: formatNaturalAmount(naturalAmount.amount),
      unit: naturalAmount.unit,
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

function getNaturalRecipeComponentAmount(recipe: IRecipe) {
  let totalBaseAmount = 0;
  let hasMass = false;
  let hasVolume = false;

  recipe.ingredients.forEach((recipeIngredient) => {
    const baseAmount = toBaseAmount(recipeIngredient.amount, recipeIngredient.unit);
    if (baseAmount === null) {
      return;
    }

    totalBaseAmount += baseAmount;
    hasMass = hasMass || isMassUnit(recipeIngredient.unit);
    hasVolume = hasVolume || isVolumeUnit(recipeIngredient.unit);
  });

  recipe.components.forEach((component) => {
    const baseAmount = toBaseAmount(component.amount, component.unit);
    if (baseAmount === null) {
      return;
    }

    totalBaseAmount += baseAmount;
    hasMass = hasMass || isMassUnit(component.unit);
    hasVolume = hasVolume || isVolumeUnit(component.unit);
  });

  return {
    amount: totalBaseAmount > 0 ? totalBaseAmount : 0,
    unit: hasVolume && !hasMass ? ("Milliliter" as MeasurementUnit) : ("Gram" as MeasurementUnit),
  };
}

function toBaseAmount(amount: number | null, unit: MeasurementUnit) {
  if (amount === null) {
    return null;
  }

  if (unit === "Gram" || unit === "Milliliter") {
    return amount;
  }

  if (unit === "Kilogram" || unit === "Liter") {
    return amount * 1000;
  }

  return null;
}

function isMassUnit(unit: MeasurementUnit) {
  return unit === "Gram" || unit === "Kilogram";
}

function isVolumeUnit(unit: MeasurementUnit) {
  return unit === "Milliliter" || unit === "Liter";
}

function formatNaturalAmount(amount: number) {
  if (amount <= 0) {
    return "";
  }

  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(2).replace(/\.?0+$/, "");
}
