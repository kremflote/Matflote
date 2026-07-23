import { useLanguage } from "../../contexts";
import type { IRecipeTagCategory } from "../../interfaces/ILookup";
import type { RecipeTag } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import type { CreatableOption } from "./CreatableSelect";
import { formatRecipeTagCategoryName } from "./formOptions";
import TagManagementDialog from "./TagManagementDialog";

type RecipeTagCreateDialogProps = {
  categories: readonly IRecipeTagCategory[];
  existingTags: readonly RecipeTag[];
  theme: SiteTheme;
  onCancel: () => void;
  onCreate: (tag: RecipeTag, categoryId: number) => Promise<void>;
  onCreateCategory: (name: string) => Promise<CreatableOption>;
  onUpdateCategory: (category: CreatableOption) => Promise<void>;
  onDeleteCategory: (category: CreatableOption) => Promise<void>;
  onUpdateTag: (tagName: string, nextName: string) => Promise<void>;
  onDeleteTag: (tagName: string) => Promise<void>;
};

function RecipeTagCreateDialog({
  categories,
  existingTags,
  theme,
  onCancel,
  onCreate,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateTag,
  onDeleteTag,
}: RecipeTagCreateDialogProps) {
  const { t } = useLanguage();

  return (
    <TagManagementDialog
      categories={categories.map((category) => ({
        id: category.recipeTagCategoryId,
        name: category.name,
        tags: category.tags,
      }))}
      existingTags={existingTags}
      formatCategoryName={(name) => formatRecipeTagCategoryName(name, t.filters.recipeTagGroups)}
      theme={theme}
      onCancel={onCancel}
      onCreate={(tag, categoryId) => onCreate(tag as RecipeTag, categoryId)}
      onCreateCategory={onCreateCategory}
      onDeleteCategory={onDeleteCategory}
      onDeleteTag={onDeleteTag}
      onUpdateCategory={onUpdateCategory}
      onUpdateTag={onUpdateTag}
    />
  );
}

export default RecipeTagCreateDialog;
