import { createContext, useContext, type Context } from "react";
import type { SupportedLanguage, TranslationDictionary } from "../i18n";
import type { IBrandContext } from "../interfaces/contexts/IBrandContext";
import type { IIngredientContext } from "../interfaces/contexts/IIngredientContext";
import type { IIngredientTagCategoryContext } from "../interfaces/contexts/IIngredientTagCategoryContext";
import type { IMealPlanContext } from "../interfaces/contexts/IMealPlanContext";
import type { IRecipeContext } from "../interfaces/contexts/IRecipeContext";

// The context objects and their hooks live apart from the provider components so that
// each provider file only exports a component (keeps React Fast Refresh working).

export type LanguageContextValue = {
  language: SupportedLanguage;
  locale: string;
  setLanguage: (language: SupportedLanguage) => void;
  t: TranslationDictionary;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);
export const BrandContext = createContext<IBrandContext | null>(null);
export const IngredientContext = createContext<IIngredientContext | null>(null);
export const IngredientTagCategoryContext = createContext<IIngredientTagCategoryContext | null>(null);
export const MealPlanContext = createContext<IMealPlanContext | null>(null);
export const RecipeContext = createContext<IRecipeContext | null>(null);

function useRequiredContext<TValue>(context: Context<TValue | null>, name: string, provider: string): TValue {
  const value = useContext(context);
  if (value === null) {
    throw new Error(`${name} must be used inside ${provider}.`);
  }

  return value;
}

export function useBrands() {
  return useRequiredContext(BrandContext, "useBrands", "BrandProvider");
}

export function useIngredients() {
  return useRequiredContext(IngredientContext, "useIngredients", "IngredientProvider");
}

export function useIngredientTagCategories() {
  return useRequiredContext(IngredientTagCategoryContext, "useIngredientTagCategories", "IngredientTagCategoryProvider");
}

export function useLanguage() {
  return useRequiredContext(LanguageContext, "useLanguage", "LanguageProvider");
}

export function useMealPlan() {
  return useRequiredContext(MealPlanContext, "useMealPlan", "MealPlanProvider");
}

export function useRecipes() {
  return useRequiredContext(RecipeContext, "useRecipes", "RecipeProvider");
}
