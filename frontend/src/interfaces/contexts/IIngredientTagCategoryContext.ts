import type { IIngredientTagCategory } from "../ILookup";

export interface IIngredientTagCategoryContext {
  ingredientTagCategories: IIngredientTagCategory[];
  ingredientTagCategoryIsLoading: boolean;
  initError: string | null;
  refreshIngredientTagCategories: () => Promise<void>;
}
