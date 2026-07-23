import type { IRecipeTagCategory } from "../ILookup";

export interface IRecipeTagCategoryContext {
  recipeTagCategories: IRecipeTagCategory[];
  recipeTagCategoryIsLoading: boolean;
  initError: string | null;
  refreshRecipeTagCategories: () => Promise<void>;
}
