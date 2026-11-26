import type { IRecipe } from "../IRecipe";

export interface IRecipeContext {
  recipes: IRecipe[];
  /** True only until the first load has finished; a refresh keeps the current list. */
  recipeIsLoading: boolean;
  initError: string | null;
  refreshRecipes: () => Promise<void>;
  /** Puts a recipe returned by a create or update into the list without refetching it. */
  upsertRecipe: (recipe: IRecipe) => void;
}
