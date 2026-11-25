import type { Vitamin } from "../../interfaces/IIngredient";

/** The nutrition editor's fields, as typed (strings, empty when unknown). */
export type NutritionEditorValues = {
  calories: string;
  carbohydrateGrams: string;
  proteinGrams: string;
  fatGrams: string;
  saltGrams: string;
  dietaryFiberGrams: string;
  saturatedFatGrams: string;
  transFatGrams: string;
  monounsaturatedFatGrams: string;
  polyunsaturatedFatGrams: string;
  omega3Grams: string;
  omega6Grams: string;
  cholesterolMilligrams: string;
  vitaminAMicrograms: string;
  vitaminB9Micrograms: string;
  vitaminB12Micrograms: string;
  vitaminCMilligrams: string;
  vitaminDMicrograms: string;
  vitaminEMilligrams: string;
};

export function deriveVitaminsFromNutritionValues(values: NutritionEditorValues): Vitamin[] {
  const vitamins: Vitamin[] = [];

  if (hasValue(values.vitaminAMicrograms)) {
    vitamins.push("VitaminA");
  }
  if (hasValue(values.vitaminB9Micrograms)) {
    vitamins.push("VitaminB9");
  }
  if (hasValue(values.vitaminB12Micrograms)) {
    vitamins.push("VitaminB12");
  }
  if (hasValue(values.vitaminCMilligrams)) {
    vitamins.push("VitaminC");
  }
  if (hasValue(values.vitaminDMicrograms)) {
    vitamins.push("VitaminD");
  }
  if (hasValue(values.vitaminEMilligrams)) {
    vitamins.push("VitaminE");
  }
  return vitamins;
}

function hasValue(value: string) {
  return value.trim().length > 0;
}
