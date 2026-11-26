import type { IngredientTag } from "../../interfaces/IIngredient";
import { ingredientTagCategoryService } from "../../services";
import type { CreatableOption } from "./CreatableSelect";

type TagManagementOptions = {
  /** Reloads the tag categories after any change. */
  refreshCategories: () => Promise<unknown>;
  /** Reloads what shows tags (ingredients, recipes) after a tag or category is renamed or deleted. */
  refreshTagUsers: () => Promise<unknown>;
  /** A new tag was made from the form: select it, close the dialog. */
  onTagCreated: (tag: IngredientTag) => void;
  onTagRenamed?: (tagName: string, nextName: string) => void;
  onTagDeleted?: (tagName: string) => void;
};

/**
 * What IngredientTagCreateDialog does with the server, shared by the recipe form, the ingredient form and the
 * scanner (AUDIT F20). Spread the result into the dialog's props.
 */
export function tagManagementHandlers({
  refreshCategories,
  refreshTagUsers,
  onTagCreated,
  onTagRenamed,
  onTagDeleted,
}: TagManagementOptions) {
  return {
    onCreate: async (tag: IngredientTag, categoryId: number) => {
      await ingredientTagCategoryService.createTag(categoryId, { name: tag });
      await refreshCategories();
      onTagCreated(tag);
    },
    onCreateCategory: async (name: string, mode: "ingredients" | "recipes"): Promise<CreatableOption> => {
      const category = await ingredientTagCategoryService.create({
        name,
        showForIngredients: mode === "ingredients",
        showForRecipes: mode === "recipes",
      });
      await refreshCategories();
      return {
        id: category.ingredientTagCategoryId,
        name: category.name,
        showForIngredients: category.showForIngredients,
        showForRecipes: category.showForRecipes,
      };
    },
    onUpdateCategory: async (category: CreatableOption) => {
      await ingredientTagCategoryService.update(category.id, {
        name: category.name,
        showForIngredients: category.showForIngredients,
        showForRecipes: category.showForRecipes,
      });
      await refreshCategories();
    },
    onDeleteCategory: async (category: CreatableOption) => {
      await ingredientTagCategoryService.delete(category.id);
      await refreshCategories();
      await refreshTagUsers();
    },
    onUpdateTag: async (tagName: string, nextName: string) => {
      await ingredientTagCategoryService.updateTag(tagName, { name: nextName });
      await refreshCategories();
      await refreshTagUsers();
      onTagRenamed?.(tagName, nextName);
    },
    onDeleteTag: async (tagName: string) => {
      await ingredientTagCategoryService.deleteTag(tagName);
      await refreshCategories();
      await refreshTagUsers();
      onTagDeleted?.(tagName);
    },
    onMoveCategory: async (categoryId: number, direction: "Up" | "Down") => {
      await ingredientTagCategoryService.move(categoryId, direction);
      await refreshCategories();
    },
    onMoveTag: async (tagId: number, direction: "Up" | "Down") => {
      await ingredientTagCategoryService.moveTag(tagId, direction);
      await refreshCategories();
    },
  };
}
