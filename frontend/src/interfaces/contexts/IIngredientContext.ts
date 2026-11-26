import type { IIngredient } from "../IIngredient";

export interface IIngredientContext {
  ingredients: IIngredient[];
  /** True only until the first load has finished; a refresh keeps the current list. */
  ingredientIsLoading: boolean;
  initError: string | null;
  refreshIngredients: () => Promise<void>;
  removeIngredient: (ingredientId: number) => void;
  /** Puts an ingredient returned by a create or update into the list without refetching it. */
  upsertIngredient: (ingredient: IIngredient) => void;
}
