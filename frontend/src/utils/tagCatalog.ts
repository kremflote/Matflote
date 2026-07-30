import type { IIngredientTagCategory, IIngredientTagDefinition } from "../interfaces/ILookup";

export function getTagName(tag: IIngredientTagDefinition | string) {
  return typeof tag === "string" ? tag : tag.name;
}

export function getCategoryTagNames(category: Pick<IIngredientTagCategory, "tags">) {
  return category.tags.map(getTagName);
}

export function getAllCategoryTagNames(categories: readonly Pick<IIngredientTagCategory, "tags">[]) {
  return categories.flatMap(getCategoryTagNames);
}
