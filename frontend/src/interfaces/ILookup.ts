export interface IBrand {
  brandId: number;
  name: string;
}

export interface IStore {
  storeId: number;
  name: string;
}

export interface IIngredientTagDefinition {
  ingredientTagDefinitionId: number;
  name: string;
  sortOrder: number;
  isSystemTag: boolean;
  systemKey: string | null;
}

export interface IIngredientTagCategory {
  ingredientTagCategoryId: number;
  name: string;
  sortOrder: number;
  showForIngredients: boolean;
  showForRecipes: boolean;
  tags: IIngredientTagDefinition[];
}
