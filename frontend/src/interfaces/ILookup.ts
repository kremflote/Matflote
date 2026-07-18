export interface IBrand {
  brandId: number;
  name: string;
}

export interface ICuisine {
  cuisineId: number;
  name: string;
}

export interface IStore {
  storeId: number;
  name: string;
}

export interface IIngredientTagCategory {
  ingredientTagCategoryId: number;
  name: string;
  tags: string[];
}
