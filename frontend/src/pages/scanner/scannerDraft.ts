// The ingredient draft a product lookup becomes before it is saved, and the pure functions that build and change it.


import type { IngredientTag, INutritionFacts, NutritionDataSource } from "../../interfaces/IIngredient";
import type { IBrand } from "../../interfaces/ILookup";
import type { IMatvaretabellenCandidate, IProductLookupNutrition, IProductLookupResult } from "../../interfaces/IProductLookup";
import type { MatvaretabellenNutritionCandidate } from "../../components/recipeBrowser/MatvaretabellenSearchDialog";
import type { NutritionEditorValues } from "../../components/recipeBrowser/nutritionEditorValues";
import { numberToInputValue, parseOptionalNumber } from "../../utils/formValues";

export type IngredientCandidate = {
  id: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  kassalappNutritionPer100: INutritionFacts | null;
  matvaretabellenNutritionPer100: INutritionFacts | null;
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSupplementSource: NutritionDataSource | null;
  matvaretabellenSupplementAttempted: boolean;
  matvaretabellenSupplementStatus: "NotAttempted" | "Matched" | "NoMatch";
  matvaretabellenCandidates: MatvaretabellenCandidate[];
  nutritionSourceLabel: string | null;
  kassalappUrl: string | null;
  matvaretabellenFoodId: string | null;
  matvaretabellenUrl: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  tags: IngredientTag[];
  product: IProductLookupResult;
};

export type IngredientDraft = {
  name: string;
  brandId: number | null;
  brandName: string;
  imageUrl: string | null;
  imageFile: File | null;
  tags: IngredientTag[];
  kassalappNutritionPer100: INutritionFacts | null;
  matvaretabellenNutritionPer100: INutritionFacts | null;
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSupplementSource: NutritionDataSource | null;
  matvaretabellenSupplementAttempted: boolean;
  matvaretabellenSupplementStatus: "NotAttempted" | "Matched" | "NoMatch";
  matvaretabellenCandidates: MatvaretabellenCandidate[];
  nutritionSourceLabel: string | null;
  kassalappUrl: string | null;
  matvaretabellenFoodId: string | null;
  matvaretabellenUrl: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  autofillSources: Partial<Record<ScannerAutofillField, AutofillSource[]>>;
  nutritionAutofillSources: Partial<Record<keyof NutritionEditorValues, AutofillSource>>;
};

export type MatvaretabellenCandidate = MatvaretabellenNutritionCandidate;

export type AutofillSource = Exclude<NutritionDataSource, "None">;

export type ScannerAutofillField = "name" | "brand" | "image" | "tags";

export const nutritionEditorKeys: (keyof NutritionEditorValues)[] = [
  "calories",
  "carbohydrateGrams",
  "proteinGrams",
  "fatGrams",
  "saltGrams",
  "dietaryFiberGrams",
  "saturatedFatGrams",
  "transFatGrams",
  "monounsaturatedFatGrams",
  "polyunsaturatedFatGrams",
  "omega3Grams",
  "omega6Grams",
  "cholesterolMilligrams",
  "vitaminAMicrograms",
  "vitaminB9Micrograms",
  "vitaminB12Micrograms",
  "vitaminCMilligrams",
  "vitaminDMicrograms",
  "vitaminEMilligrams",
];

export function updateNutritionDraft(draft: IngredientDraft, key: keyof NutritionEditorValues, value: string): IngredientDraft {
  return {
    ...draft,
    nutritionPer100: {
      ...emptyNutritionFacts(),
      ...draft.nutritionPer100,
      [key]: parseOptionalNumber(value),
    },
  };
}

export function clearNutritionAutofillSource(draft: IngredientDraft, key: keyof NutritionEditorValues): IngredientDraft {
  if (draft.nutritionAutofillSources[key] === undefined) {
    return draft;
  }

  const { [key]: _removedField, ...nutritionAutofillSources } = draft.nutritionAutofillSources;
  return { ...draft, nutritionAutofillSources };
}

export function applyMatvaretabellenCandidate(
  draft: IngredientDraft,
  candidate: MatvaretabellenCandidate,
): IngredientDraft {
  const mergedNutrition = mergeNutrition(draft.kassalappNutritionPer100, candidate.nutrition);
  return {
    ...draft,
    matvaretabellenNutritionPer100: candidate.nutrition,
    nutritionPer100: mergedNutrition.nutrition,
    nutritionSource: draft.kassalappNutritionPer100 === null ? "Matvaretabellen" : "Kassalapp",
    nutritionSupplementSource: draft.kassalappNutritionPer100 !== null && mergedNutrition.usedSupplement ? "Matvaretabellen" : null,
    matvaretabellenSupplementAttempted: true,
    matvaretabellenSupplementStatus: "Matched",
    nutritionSourceLabel: draft.kassalappNutritionPer100 === null ? "Matvaretabellen" : "Kassalapp",
    matvaretabellenFoodId: candidate.foodId,
    matvaretabellenUrl: candidate.url,
    nutritionMatchedName: candidate.foodName,
    nutritionMatchConfidence: candidate.confidence,
    autofillSources: {
      ...draft.autofillSources,
    },
    nutritionAutofillSources: getNutritionAutofillSources(draft.kassalappNutritionPer100, candidate.nutrition),
  };
}

export function removeMatvaretabellenSupplement(draft: IngredientDraft): IngredientDraft {
  return {
    ...draft,
    matvaretabellenNutritionPer100: null,
    nutritionPer100: draft.kassalappNutritionPer100,
    nutritionSource: draft.kassalappNutritionPer100 === null ? "None" : "Kassalapp",
    nutritionSupplementSource: null,
    matvaretabellenSupplementStatus: draft.matvaretabellenSupplementAttempted ? "NoMatch" : "NotAttempted",
    nutritionSourceLabel: draft.kassalappNutritionPer100 === null ? null : "Kassalapp",
    matvaretabellenFoodId: null,
    matvaretabellenUrl: null,
    nutritionMatchedName: null,
    nutritionMatchConfidence: null,
    autofillSources: {
      ...draft.autofillSources,
    },
    nutritionAutofillSources: getNutritionAutofillSources(draft.kassalappNutritionPer100, null),
  };
}

export function mergeNutrition(primary: INutritionFacts | null, supplement: INutritionFacts | null) {
  if (primary === null) {
    return { nutrition: supplement, usedSupplement: supplement !== null };
  }

  if (supplement === null) {
    return { nutrition: primary, usedSupplement: false };
  }

  const nutrition: INutritionFacts = {
    calories: primary.calories ?? supplement.calories,
    carbohydrateGrams: primary.carbohydrateGrams ?? supplement.carbohydrateGrams,
    proteinGrams: primary.proteinGrams ?? supplement.proteinGrams,
    fatGrams: primary.fatGrams ?? supplement.fatGrams,
    saltGrams: primary.saltGrams ?? supplement.saltGrams,
    dietaryFiberGrams: primary.dietaryFiberGrams ?? supplement.dietaryFiberGrams,
    saturatedFatGrams: primary.saturatedFatGrams ?? supplement.saturatedFatGrams,
    transFatGrams: primary.transFatGrams ?? supplement.transFatGrams,
    monounsaturatedFatGrams: primary.monounsaturatedFatGrams ?? supplement.monounsaturatedFatGrams,
    polyunsaturatedFatGrams: primary.polyunsaturatedFatGrams ?? supplement.polyunsaturatedFatGrams,
    omega3Grams: primary.omega3Grams ?? supplement.omega3Grams,
    omega6Grams: primary.omega6Grams ?? supplement.omega6Grams,
    cholesterolMilligrams: primary.cholesterolMilligrams ?? supplement.cholesterolMilligrams,
    vitaminAMicrograms: primary.vitaminAMicrograms ?? supplement.vitaminAMicrograms,
    vitaminB9Micrograms: primary.vitaminB9Micrograms ?? supplement.vitaminB9Micrograms,
    vitaminB12Micrograms: primary.vitaminB12Micrograms ?? supplement.vitaminB12Micrograms,
    vitaminCMilligrams: primary.vitaminCMilligrams ?? supplement.vitaminCMilligrams,
    vitaminDMicrograms: primary.vitaminDMicrograms ?? supplement.vitaminDMicrograms,
    vitaminEMilligrams: primary.vitaminEMilligrams ?? supplement.vitaminEMilligrams,
  };

  return { nutrition, usedSupplement: hasSupplementFilledMissingValue(primary, supplement) };
}

export function hasSupplementFilledMissingValue(primary: INutritionFacts, supplement: INutritionFacts) {
  return (primary.calories === null && supplement.calories !== null)
    || (primary.carbohydrateGrams === null && supplement.carbohydrateGrams !== null)
    || (primary.proteinGrams === null && supplement.proteinGrams !== null)
    || (primary.fatGrams === null && supplement.fatGrams !== null)
    || (primary.saltGrams === null && supplement.saltGrams !== null)
    || (primary.dietaryFiberGrams === null && supplement.dietaryFiberGrams !== null)
    || (primary.saturatedFatGrams === null && supplement.saturatedFatGrams !== null)
    || (primary.transFatGrams === null && supplement.transFatGrams !== null)
    || (primary.monounsaturatedFatGrams === null && supplement.monounsaturatedFatGrams !== null)
    || (primary.polyunsaturatedFatGrams === null && supplement.polyunsaturatedFatGrams !== null)
    || (primary.omega3Grams === null && supplement.omega3Grams !== null)
    || (primary.omega6Grams === null && supplement.omega6Grams !== null)
    || (primary.cholesterolMilligrams === null && supplement.cholesterolMilligrams !== null)
    || (primary.vitaminAMicrograms === null && supplement.vitaminAMicrograms !== null)
    || (primary.vitaminB9Micrograms === null && supplement.vitaminB9Micrograms !== null)
    || (primary.vitaminB12Micrograms === null && supplement.vitaminB12Micrograms !== null)
    || (primary.vitaminCMilligrams === null && supplement.vitaminCMilligrams !== null)
    || (primary.vitaminDMicrograms === null && supplement.vitaminDMicrograms !== null)
    || (primary.vitaminEMilligrams === null && supplement.vitaminEMilligrams !== null);
}

export function buildIngredientCandidates(products: IProductLookupResult[]): IngredientCandidate[] {
  const seen = new Set<string>();
  return products
    .map((product, index) => {
      const name = cleanIngredientName(product.name);
      const brandName = (product.brand ?? product.vendor ?? "").trim();
      const candidate: IngredientCandidate = {
        id: `${product.ean}-${index}`,
        name,
        brandName,
        imageUrl: product.imageUrl,
        kassalappNutritionPer100: toIngredientNutrition(product.kassalappNutritionPer100),
        matvaretabellenNutritionPer100: toIngredientNutrition(product.matvaretabellenNutritionPer100),
        nutritionPer100: toIngredientNutrition(product.nutritionPer100),
        nutritionSource: product.nutritionSource,
        nutritionSupplementSource: product.nutritionSupplementSource,
        matvaretabellenSupplementAttempted: product.matvaretabellenSupplementAttempted,
        matvaretabellenSupplementStatus: product.matvaretabellenSupplementStatus,
        matvaretabellenCandidates: product.matvaretabellenCandidates.map(toMatvaretabellenCandidate),
        nutritionSourceLabel: product.nutritionSourceLabel,
        kassalappUrl: product.kassalappUrl,
        matvaretabellenFoodId: product.matvaretabellenFoodId,
        matvaretabellenUrl: product.matvaretabellenUrl,
        nutritionMatchedName: product.nutritionMatchedName,
        nutritionMatchConfidence: product.nutritionMatchConfidence,
        tags: [],
        product,
      };

      return candidate;
    })
    .filter((candidate) => {
      const key = `${candidate.name.toLowerCase()}|${candidate.brandName.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function toMatvaretabellenCandidate(candidate: IMatvaretabellenCandidate): MatvaretabellenCandidate {
  return {
    foodId: candidate.foodId,
    foodName: candidate.foodName,
    url: candidate.url,
    confidence: candidate.confidence,
    nutrition: toIngredientNutrition(candidate.nutrition) ?? emptyNutritionFacts(),
  };
}

export function candidateToDraft(candidate: IngredientCandidate, brands: IBrand[]): IngredientDraft {
  return {
    name: candidate.name,
    brandId: findBrandId(candidate.brandName, brands),
    brandName: candidate.brandName,
    imageUrl: candidate.imageUrl,
    imageFile: null,
    tags: candidate.tags,
    kassalappNutritionPer100: candidate.kassalappNutritionPer100,
    matvaretabellenNutritionPer100: candidate.matvaretabellenNutritionPer100,
    nutritionPer100: candidate.nutritionPer100,
    nutritionSource: candidate.nutritionSource,
    nutritionSupplementSource: candidate.nutritionSupplementSource,
    matvaretabellenSupplementAttempted: candidate.matvaretabellenSupplementAttempted,
    matvaretabellenSupplementStatus: candidate.matvaretabellenSupplementStatus,
    matvaretabellenCandidates: candidate.matvaretabellenCandidates,
    nutritionSourceLabel: candidate.nutritionSourceLabel,
    kassalappUrl: candidate.kassalappUrl,
    matvaretabellenFoodId: candidate.matvaretabellenFoodId,
    matvaretabellenUrl: candidate.matvaretabellenUrl,
    nutritionMatchedName: candidate.nutritionMatchedName,
    nutritionMatchConfidence: candidate.nutritionMatchConfidence,
    autofillSources: {
      name: candidate.name.trim().length > 0 ? ["Kassalapp"] : undefined,
      brand: candidate.brandName.trim().length > 0 ? ["Kassalapp"] : undefined,
      image: candidate.imageUrl !== null ? ["Kassalapp"] : undefined,
    },
    nutritionAutofillSources: getNutritionAutofillSources(
      candidate.kassalappNutritionPer100,
      candidate.matvaretabellenNutritionPer100,
    ),
  };
}

export function clearAutofillSource(draft: IngredientDraft, field: ScannerAutofillField): IngredientDraft {
  if (draft.autofillSources[field] === undefined) {
    return draft;
  }

  const { [field]: _removedField, ...autofillSources } = draft.autofillSources;
  return { ...draft, autofillSources };
}

export function getAutofillSourceLabel(
  draft: IngredientDraft,
  field: ScannerAutofillField,
  label: (source: string) => string,
) {
  const sources = draft.autofillSources[field];
  if (sources === undefined || sources.length === 0) {
    return null;
  }

  return label(sources.map(formatAutofillSourceName).join(" / "));
}

export function formatAutofillSourceName(source: AutofillSource) {
  if (source === "Kassalapp") {
    return "kassal.app";
  }

  if (source === "Matvaretabellen") {
    return "Matvaretabellen";
  }

  return "manual";
}

export function getNutritionAutofillSources(
  kassalappNutrition: INutritionFacts | null,
  matvaretabellenNutrition: INutritionFacts | null,
): Partial<Record<keyof NutritionEditorValues, AutofillSource>> {
  const sources: Partial<Record<keyof NutritionEditorValues, AutofillSource>> = {};

  for (const key of nutritionEditorKeys) {
    if (kassalappNutrition?.[key] !== null && kassalappNutrition?.[key] !== undefined) {
      sources[key] = "Kassalapp";
    } else if (matvaretabellenNutrition?.[key] !== null && matvaretabellenNutrition?.[key] !== undefined) {
      sources[key] = "Matvaretabellen";
    }
  }

  return sources;
}

export function getNutritionFieldSubtitles(
  draft: IngredientDraft,
  label: (source: string) => string,
): Partial<Record<keyof NutritionEditorValues, string>> {
  return Object.fromEntries(
    Object.entries(draft.nutritionAutofillSources).map(([key, source]) => [
      key,
      label(formatAutofillSourceName(source)),
    ]),
  ) as Partial<Record<keyof NutritionEditorValues, string>>;
}

export function getNutritionSource(
  draft: IngredientDraft,
  labels: Record<NutritionDataSource, string>,
) {
  if (draft.nutritionPer100 === null || draft.nutritionSource === "None") {
    return { text: labels.None, primary: null, supplement: null };
  }

  const matchedName = draft.nutritionMatchedName?.trim() ?? null;
  const primary = sourceLink(
    labels,
    draft.nutritionSource,
    draft.nutritionSource === "Kassalapp" ? draft.kassalappUrl : draft.matvaretabellenUrl,
    draft.nutritionSource === "Matvaretabellen" ? matchedName : null,
  );
  const supplement = draft.nutritionSupplementSource === null
    ? null
    : sourceLink(
        labels,
        draft.nutritionSupplementSource,
        draft.nutritionSupplementSource === "Kassalapp" ? draft.kassalappUrl : draft.matvaretabellenUrl,
        draft.nutritionSupplementSource === "Matvaretabellen" ? matchedName : null,
      );

  if (supplement !== null) {
    return {
      text: `${primary.label}, ${supplement.label}`,
      primary,
      supplement,
    };
  }

  return {
    text: primary.label,
    primary,
    supplement: null,
  };
}

export type NutritionSourceLink = {
  label: string;
  url: string | null;
};

export function sourceLink(
  labels: Record<NutritionDataSource, string>,
  source: NutritionDataSource,
  url: string | null,
  matchedName: string | null,
): NutritionSourceLink {
  const label = source === "Matvaretabellen" && matchedName
    ? `Matvaretabellen: ${matchedName}`
    : source === "Kassalapp"
      ? "Kassalapp"
      : labels[source];

  return { label, url };
}

export function findBrandId(brandName: string, brands: IBrand[]) {
  const normalizedBrandName = brandName.trim().toLowerCase();
  if (normalizedBrandName.length === 0) {
    return null;
  }

  return brands.find((brand) => brand.name.toLowerCase() === normalizedBrandName)?.brandId ?? null;
}

export function cleanIngredientName(name: string) {
  return name.replace(/\s{2,}/g, " ").trim();
}

export function toIngredientNutrition(nutrition: IProductLookupNutrition | null): INutritionFacts | null {
  if (nutrition === null) {
    return null;
  }

  return {
    calories: nutrition.calories,
    carbohydrateGrams: nutrition.carbohydrateGrams,
    proteinGrams: nutrition.proteinGrams,
    fatGrams: nutrition.fatGrams,
    saltGrams: nutrition.saltGrams,
    dietaryFiberGrams: nutrition.dietaryFiberGrams,
    saturatedFatGrams: nutrition.saturatedFatGrams,
    transFatGrams: nutrition.transFatGrams,
    monounsaturatedFatGrams: nutrition.monounsaturatedFatGrams,
    polyunsaturatedFatGrams: nutrition.polyunsaturatedFatGrams,
    omega3Grams: nutrition.omega3Grams,
    omega6Grams: nutrition.omega6Grams,
    cholesterolMilligrams: nutrition.cholesterolMilligrams,
    vitaminAMicrograms: nutrition.vitaminAMicrograms,
    vitaminB9Micrograms: nutrition.vitaminB9Micrograms,
    vitaminB12Micrograms: nutrition.vitaminB12Micrograms,
    vitaminCMilligrams: nutrition.vitaminCMilligrams,
    vitaminDMicrograms: nutrition.vitaminDMicrograms,
    vitaminEMilligrams: nutrition.vitaminEMilligrams,
  };
}

export function emptyNutritionFacts(): INutritionFacts {
  return {
    calories: null,
    carbohydrateGrams: null,
    proteinGrams: null,
    fatGrams: null,
    saltGrams: null,
    dietaryFiberGrams: null,
    saturatedFatGrams: null,
    transFatGrams: null,
    monounsaturatedFatGrams: null,
    polyunsaturatedFatGrams: null,
    omega3Grams: null,
    omega6Grams: null,
    cholesterolMilligrams: null,
    vitaminAMicrograms: null,
    vitaminB9Micrograms: null,
    vitaminB12Micrograms: null,
    vitaminCMilligrams: null,
    vitaminDMicrograms: null,
    vitaminEMilligrams: null,
  };
}

export function nutritionToEditorValues(nutrition: INutritionFacts | null): NutritionEditorValues {
  return {
    calories: numberToInputValue(nutrition?.calories),
    carbohydrateGrams: numberToInputValue(nutrition?.carbohydrateGrams),
    proteinGrams: numberToInputValue(nutrition?.proteinGrams),
    fatGrams: numberToInputValue(nutrition?.fatGrams),
    saltGrams: numberToInputValue(nutrition?.saltGrams),
    dietaryFiberGrams: numberToInputValue(nutrition?.dietaryFiberGrams),
    saturatedFatGrams: numberToInputValue(nutrition?.saturatedFatGrams),
    transFatGrams: numberToInputValue(nutrition?.transFatGrams),
    monounsaturatedFatGrams: numberToInputValue(nutrition?.monounsaturatedFatGrams),
    polyunsaturatedFatGrams: numberToInputValue(nutrition?.polyunsaturatedFatGrams),
    omega3Grams: numberToInputValue(nutrition?.omega3Grams),
    omega6Grams: numberToInputValue(nutrition?.omega6Grams),
    cholesterolMilligrams: numberToInputValue(nutrition?.cholesterolMilligrams),
    vitaminAMicrograms: numberToInputValue(nutrition?.vitaminAMicrograms),
    vitaminB9Micrograms: numberToInputValue(nutrition?.vitaminB9Micrograms),
    vitaminB12Micrograms: numberToInputValue(nutrition?.vitaminB12Micrograms),
    vitaminCMilligrams: numberToInputValue(nutrition?.vitaminCMilligrams),
    vitaminDMicrograms: numberToInputValue(nutrition?.vitaminDMicrograms),
    vitaminEMilligrams: numberToInputValue(nutrition?.vitaminEMilligrams),
  };
}
