import type { MeasurementUnit } from "./IIngredient";

export interface IGroceryList {
  from: string;
  to: string;
  generatedAt: string;
  sections: IGroceryListSection[];
}

export interface IGroceryListSection {
  name: string;
  items: IGroceryListItem[];
}

export interface IGroceryListItem {
  ingredientId: number;
  ingredientName: string;
  brandName: string | null;
  amount: number | null;
  unit: MeasurementUnit;
  isApproximate: boolean;
  displayAmount: string;
  sourceRecipes: string[];
  tags: string[];
}

export interface IShoppingListExportResult {
  provider: string;
  externalId: string;
  externalUrl: string | null;
  message: string;
}
