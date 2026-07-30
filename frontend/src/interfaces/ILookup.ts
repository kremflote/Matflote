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
}

export interface IIngredientTagCategory {
  ingredientTagCategoryId: number;
  name: string;
  sortOrder: number;
  tags: IIngredientTagDefinition[];
}
