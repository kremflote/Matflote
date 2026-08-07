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

export interface IStorePriceSummary {
  storeId: number;
  storeName: string;
  latestPrice: number;
  latestDate: string;
  pricePointCount: number;
}

export interface IIngredientPriceSummary {
  ingredientId: number;
  ingredientName: string;
  latestPrice: number | null;
  latestStoreName: string | null;
  latestDate: string | null;
  lowestPrice: number | null;
  lowestStoreName: string | null;
  lowestDate: string | null;
  averagePrice: number | null;
  pricePointCount: number;
  stores: IStorePriceSummary[];
}
