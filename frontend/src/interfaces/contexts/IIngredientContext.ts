import type { IIngredient } from "../IIngredient";

export interface IIngredientContext {
  ingredients: IIngredient[];
  ingredientIsLoading: boolean;
  initError: string | null;
  refreshIngredients: () => Promise<void>;
}
