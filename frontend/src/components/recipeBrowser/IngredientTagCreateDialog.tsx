import { useLanguage } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { IIngredientTagCategory } from "../../interfaces/ILookup";
import type { SiteTheme } from "../../styles/appStyles";
import type { CreatableOption } from "./CreatableSelect";
import { formatIngredientTagCategoryName } from "./formOptions";
import TagManagementDialog from "./TagManagementDialog";

type IngredientTagCreateDialogProps = {
  categories: readonly IIngredientTagCategory[];
  existingTags: readonly IngredientTag[];
  initialMode?: "ingredients" | "recipes";
  theme: SiteTheme;
  onCancel: () => void;
  onCreate: (tag: IngredientTag, categoryId: number) => Promise<void>;
  onCreateCategory: (name: string, mode: "ingredients" | "recipes") => Promise<CreatableOption>;
  onUpdateCategory: (category: CreatableOption) => Promise<void>;
  onDeleteCategory: (category: CreatableOption) => Promise<void>;
  onUpdateTag: (tagName: string, nextName: string) => Promise<void>;
  onDeleteTag: (tagName: string) => Promise<void>;
  onMoveCategory: (categoryId: number, direction: "Up" | "Down") => Promise<void>;
  onMoveTag: (tagId: number, direction: "Up" | "Down") => Promise<void>;
};

function IngredientTagCreateDialog({
  categories,
  existingTags,
  initialMode = "ingredients",
  theme,
  onCancel,
  onCreate,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateTag,
  onDeleteTag,
  onMoveCategory,
  onMoveTag,
}: IngredientTagCreateDialogProps) {
  const { t } = useLanguage();

  return (
    <TagManagementDialog
      categories={categories.map((category) => ({
        id: category.ingredientTagCategoryId,
        name: category.name,
        showForIngredients: category.showForIngredients,
        showForRecipes: category.showForRecipes,
        tags: category.tags.map((tag) => ({
          id: tag.ingredientTagDefinitionId,
          name: tag.name,
          isSystemTag: tag.isSystemTag,
          systemKey: tag.systemKey,
        })),
      }))}
      existingTags={existingTags}
      formatCategoryName={(name) =>
        formatIngredientTagCategoryName(name, t.filters.ingredientTagGroups)
      }
      initialMode={initialMode}
      theme={theme}
      onCancel={onCancel}
      onCreate={(tag, categoryId) => onCreate(tag as IngredientTag, categoryId)}
      onCreateCategory={onCreateCategory}
      onDeleteCategory={onDeleteCategory}
      onDeleteTag={onDeleteTag}
      onMoveCategory={onMoveCategory}
      onMoveTag={onMoveTag}
      onUpdateCategory={onUpdateCategory}
      onUpdateTag={onUpdateTag}
    />
  );
}

export default IngredientTagCreateDialog;
