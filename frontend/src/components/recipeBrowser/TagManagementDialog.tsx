import { useId, useState } from "react";
import { useLanguage } from "../../contexts";
import type { SiteTheme } from "../../styles/appStyles";
import ConfirmationDialog from "../ConfirmationDialog";
import Modal from "../Modal";
import type { CreatableOption } from "./CreatableSelect";
import { normalizeCustomTagName } from "./formOptions";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

export type ManagedTagCategory = {
  id: number;
  name: string;
  tags: string[];
};

type TagManagementDialogProps = {
  categories: readonly ManagedTagCategory[];
  existingTags: readonly string[];
  formatCategoryName: (name: string) => string;
  theme: SiteTheme;
  onCancel: () => void;
  onCreate: (tag: string, categoryId: number) => Promise<void>;
  onCreateCategory: (name: string) => Promise<CreatableOption>;
  onUpdateCategory: (category: CreatableOption) => Promise<void>;
  onDeleteCategory: (category: CreatableOption) => Promise<void>;
  onUpdateTag: (tagName: string, nextName: string) => Promise<void>;
  onDeleteTag: (tagName: string) => Promise<void>;
};

type NameDialogMode = "tag" | "category";

function TagManagementDialog({
  categories,
  existingTags,
  formatCategoryName,
  theme,
  onCancel,
  onCreate,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateTag,
  onDeleteTag,
}: TagManagementDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const nameDialogTitleId = useId();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(categories[0]?.id ?? null);
  const [nameDialogMode, setNameDialogMode] = useState<NameDialogMode | null>(null);
  const [newName, setNewName] = useState("");
  const [nameDialogError, setNameDialogError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<ManagedTagCategory | null>(null);
  const [managedCategoryNames, setManagedCategoryNames] = useState<Record<number, string>>({});
  const [managedTagNames, setManagedTagNames] = useState<Record<string, string>>({});
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;

  async function saveNewName() {
    const normalizedName = normalizeCustomTagName(newName);
    if (normalizedName.length === 0) {
      setNameDialogError(t.common.nameRequired);
      return;
    }

    if (
      nameDialogMode === "tag" &&
      existingTags.some((tag) => tag.toLowerCase() === normalizedName.toLowerCase())
    ) {
      setNameDialogError(t.common.nameAlreadyExists);
      return;
    }

    if (nameDialogMode === "tag" && selectedCategoryId === null) {
      setNameDialogError(t.filters.selectCategory);
      return;
    }

    setIsSavingName(true);
    setNameDialogError(null);

    try {
      if (nameDialogMode === "category") {
        const category = await onCreateCategory(normalizedName);
        setSelectedCategoryId(category.id);
      } else if (nameDialogMode === "tag" && selectedCategoryId !== null) {
        await onCreate(normalizedName, selectedCategoryId);
      }

      setNewName("");
      setNameDialogMode(null);
    } catch (caughtError) {
      setNameDialogError(caughtError instanceof Error ? caughtError.message : t.common.couldNotCreateOption);
    } finally {
      setIsSavingName(false);
    }
  }

  async function deleteCategory() {
    if (categoryPendingDelete === null) {
      return;
    }

    setIsDeletingCategory(true);

    try {
      await onDeleteCategory({
        id: categoryPendingDelete.id,
        name: categoryPendingDelete.name,
      });
      if (selectedCategoryId === categoryPendingDelete.id) {
        setSelectedCategoryId(null);
      }
      setCategoryPendingDelete(null);
    } finally {
      setIsDeletingCategory(false);
    }
  }

  async function updateManagedCategory(category: ManagedTagCategory) {
    const nextName = (managedCategoryNames[category.id] ?? category.name).trim();
    if (nextName.length === 0 || nextName === category.name) {
      return;
    }

    setIsManagingTags(true);
    try {
      await onUpdateCategory({ id: category.id, name: nextName });
      setManagedCategoryNames((currentNames) => {
        const { [category.id]: _removed, ...remainingNames } = currentNames;
        return remainingNames;
      });
    } finally {
      setIsManagingTags(false);
    }
  }

  async function updateManagedTag(tagName: string) {
    const nextName = normalizeCustomTagName(managedTagNames[tagName] ?? tagName);
    if (nextName.length === 0 || nextName === tagName) {
      return;
    }

    setIsManagingTags(true);
    try {
      await onUpdateTag(tagName, nextName);
      setManagedTagNames((currentNames) => {
        const { [tagName]: _removed, ...remainingNames } = currentNames;
        return remainingNames;
      });
    } finally {
      setIsManagingTags(false);
    }
  }

  async function deleteManagedTag(tagName: string) {
    setIsManagingTags(true);
    try {
      await onDeleteTag(tagName);
    } finally {
      setIsManagingTags(false);
    }
  }

  const openNameDialog = (mode: NameDialogMode) => {
    setNewName("");
    setNameDialogError(null);
    setNameDialogMode(mode);
  };

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
      closeLabel={t.common.close}
      footer={
        <>
          <button
            className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`}
            type="button"
            onClick={() => openNameDialog("category")}
          >
            {t.common.addCategory}
          </button>
          <button
            className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`}
            disabled={selectedCategory === null}
            type="button"
            onClick={() => openNameDialog("tag")}
          >
            {t.common.addTag}
          </button>
        </>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title={t.common.manageTags}
      titleClassName={recipeBrowserStyles.modalTitle}
      titleId={titleId}
      onClose={onCancel}
    >
      <div className={recipeBrowserStyles.manageTagsList}>
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;

          return (
            <section
              className={recipeBrowserStyles.manageTagCategory(theme, isSelected)}
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              <div className={`${recipeBrowserStyles.manageTagCategoryRow} ${recipeBrowserStyles.manageTagDivider(theme, "category")}`}>
                <input
                  className={recipeBrowserStyles.textField(theme)}
                  value={managedCategoryNames[category.id] ?? category.name}
                  onChange={(event) =>
                    setManagedCategoryNames((currentNames) => ({
                      ...currentNames,
                      [category.id]: event.target.value,
                    }))
                  }
                />
                <button
                  className={recipeBrowserStyles.manageTagActionButton(theme)}
                  disabled={isManagingTags}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void updateManagedCategory(category);
                  }}
                >
                  {t.common.save}
                </button>
                <button
                  className={recipeBrowserStyles.manageTagRemoveButton(theme)}
                  disabled={isManagingTags}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCategoryPendingDelete(category);
                  }}
                >
                  {t.common.remove}
                </button>
              </div>
              <div className={recipeBrowserStyles.manageTagList}>
                {category.tags.map((tag) => (
                  <div
                    className={`${recipeBrowserStyles.manageTagRow} ${recipeBrowserStyles.manageTagDivider(theme)}`}
                    key={tag}
                  >
                    <input
                      className={recipeBrowserStyles.textField(theme)}
                      value={managedTagNames[tag] ?? tag}
                      onChange={(event) =>
                        setManagedTagNames((currentNames) => ({
                          ...currentNames,
                          [tag]: event.target.value,
                        }))
                      }
                    />
                    <button
                      className={recipeBrowserStyles.manageTagActionButton(theme)}
                      disabled={isManagingTags}
                      type="button"
                      onClick={() => void updateManagedTag(tag)}
                    >
                      {t.common.save}
                    </button>
                    <button
                      className={recipeBrowserStyles.manageTagRemoveButton(theme)}
                      disabled={isManagingTags}
                      type="button"
                      onClick={() => void deleteManagedTag(tag)}
                    >
                      {t.common.remove}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {nameDialogMode !== null && (
        <Modal
          backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
          bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
          closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
          closeLabel={t.common.close}
          footer={
            <>
              <button
                className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`}
                disabled={isSavingName}
                type="button"
                onClick={() => setNameDialogMode(null)}
              >
                {t.common.cancel}
              </button>
              <button
                className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`}
                disabled={isSavingName}
                type="button"
                onClick={() => void saveNewName()}
              >
                {isSavingName ? t.common.saving : t.cookbook.create}
              </button>
            </>
          }
          footerClassName={recipeBrowserStyles.formActions}
          headerClassName={recipeBrowserStyles.modalHeader}
          panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
          title={nameDialogMode === "category" ? t.common.addCategory : t.common.addTag}
          titleClassName={recipeBrowserStyles.modalTitle}
          titleId={nameDialogTitleId}
          onClose={() => setNameDialogMode(null)}
        >
          <div className={recipeBrowserStyles.ingredientPriceDialogForm}>
            {nameDialogError !== null && <p className={recipeBrowserStyles.statusError(theme)}>{nameDialogError}</p>}
            <label className={recipeBrowserStyles.field}>
              <span className={recipeBrowserStyles.label(theme)}>{t.cookbook.name}</span>
              <input
                className={recipeBrowserStyles.textField(theme)}
                maxLength={nameDialogMode === "category" ? 120 : 64}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
            </label>
            {nameDialogMode === "tag" && (
              <label className={recipeBrowserStyles.field}>
                <span className={recipeBrowserStyles.label(theme)}>{t.filters.categories}</span>
                <select
                  className={recipeBrowserStyles.textField(theme)}
                  value={selectedCategoryId ?? ""}
                  onChange={(event) => setSelectedCategoryId(event.target.value.length === 0 ? null : Number(event.target.value))}
                >
                  <option value="">{t.filters.selectCategory}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {formatCategoryName(category.name)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </Modal>
      )}

      {categoryPendingDelete !== null && (
        <ConfirmationDialog
          body={t.common.deleteNamed(formatCategoryName(categoryPendingDelete.name))}
          confirmLabel={t.common.remove}
          isBusy={isDeletingCategory}
          theme={theme}
          title={t.common.removeNamed(formatCategoryName(categoryPendingDelete.name))}
          onCancel={() => setCategoryPendingDelete(null)}
          onConfirm={() => void deleteCategory()}
        />
      )}
    </Modal>
  );
}

export default TagManagementDialog;
