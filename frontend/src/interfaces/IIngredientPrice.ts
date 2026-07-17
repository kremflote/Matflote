import type { IStore } from "./ILookup";

export type { IStore };

export interface IIngredientPricePoint {
  ingredientPricePointId: number;
  ingredientId: number;
  ingredientName: string;
  store: IStore;
  price: number;
  date: string;
  note: string | null;
}
