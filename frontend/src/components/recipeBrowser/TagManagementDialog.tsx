import { useId, useState } from "react";
import { useLanguage } from "../../contexts";
import type { SiteTheme } from "../../styles/appStyles";
import ConfirmationDialog from "../ConfirmationDialog";
import Modal from "../Modal";
import type { CreatableOption } from "./CreatableSelect";
import { normalizeCustomTagName } from "./formOptions";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

export type ManagedTag = {
  id: number;
  name: string;
};

export type ManagedTagCategory = {
  id: number;
  name: string;
  tags: ManagedTag[];
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
  onMoveCategory: (categoryId: number, direction: "Up" | "Down") => Promise<void>;
  onMoveTag: (tagId: number, direction: "Up" | "Down") => Promise<void>;
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
  onMoveCategory,
  onMoveTag,
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
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<number>>(() => new Set());
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const canCreateTagInSelectedCategory = selectedCategory !== null && selectedCategory.id > 0;

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

    if (nameDialogMode === "tag" && !canCreateTagInSelectedCategory) {
      setNameDialogError(t.filters.selectCategory);
      return;
    }

    setIsSavingName(true);
    setNameDialogError(null);

    try {
      if (nameDialogMode === "category") {
        const category = await onCreateCategory(normalizedName);
        setSelectedCategoryId(category.id);
      } else if (nameDialogMode === "tag" && canCreateTagInSelectedCategory && selectedCategoryId !== null) {
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
        setSelectedCategoryId(categories.find((category) => category.id > 0 && category.id !== categoryPendingDelete.id)?.id ?? null);
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

  async function moveCategory(categoryId: number, direction: "Up" | "Down") {
    setIsManagingTags(true);
    try {
      await onMoveCategory(categoryId, direction);
    } finally {
      setIsManagingTags(false);
    }
  }

  async function moveTag(tagId: number, direction: "Up" | "Down") {
    setIsManagingTags(true);
    try {
      await onMoveTag(tagId, direction);
    } finally {
      setIsManagingTags(false);
    }
  }

  function toggleCategoryCollapse(categoryId: number) {
    setCollapsedCategoryIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(categoryId)) {
        nextIds.delete(categoryId);
      } else {
        nextIds.add(categoryId);
      }
      return nextIds;
    });
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
            disabled={!canCreateTagInSelectedCategory}
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
          const isSyntheticCategory = category.id <= 0;
          const isCollapsed = collapsedCategoryIds.has(category.id);

          return (
            <div className={recipeBrowserStyles.manageTagCategoryShell} key={category.id}>
              <div className={recipeBrowserStyles.manageTagCategoryControlsRail}>
                <button
                  className={recipeBrowserStyles.manageTagCollapseButton(theme)}
                  type="button"
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? t.common.expand : t.common.collapse}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleCategoryCollapse(category.id);
                  }}
                >
                  <span className={recipeBrowserStyles.manageTagCollapseIcon(isCollapsed)} aria-hidden="true">
                    <ManageTagChevron />
                  </span>
                </button>
              </div>
              <section
                className={recipeBrowserStyles.manageTagCategory(theme, isSelected)}
                onClick={() => setSelectedCategoryId(category.id)}
              >
              <div className={`${recipeBrowserStyles.manageTagCategoryRow(isCollapsed)} ${recipeBrowserStyles.manageTagDivider(theme, "category")}`}>
                <div className={recipeBrowserStyles.manageTagOrderControls}>
                  <button
                    className={recipeBrowserStyles.manageTagIconButton(theme)}
                    disabled={isManagingTags || isSyntheticCategory}
                    type="button"
                    aria-label={t.common.moveUp}
                    onClick={(event) => {
                      event.stopPropagation();
                      void moveCategory(category.id, "Up");
                    }}
                  >
                    ^
                  </button>
                  <button
                    className={recipeBrowserStyles.manageTagIconButton(theme)}
                    disabled={isManagingTags || isSyntheticCategory}
                    type="button"
                    aria-label={t.common.moveDown}
                    onClick={(event) => {
                      event.stopPropagation();
                      void moveCategory(category.id, "Down");
                    }}
                  >
                    v
                  </button>
                </div>
                <input
                  className={recipeBrowserStyles.manageTagTextField(theme)}
                  readOnly={isSyntheticCategory}
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
                  disabled={isManagingTags || isSyntheticCategory}
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
                  disabled={isManagingTags || isSyntheticCategory}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setCategoryPendingDelete(category);
                  }}
                >
                  {t.common.remove}
                </button>
              </div>
              {!isCollapsed && <div className={recipeBrowserStyles.manageTagList}>
                {category.tags.map((tag) => (
                  <div
                    className={`${recipeBrowserStyles.manageTagRow} ${recipeBrowserStyles.manageTagDivider(theme)}`}
                    key={tag.id}
                  >
                    <div className={recipeBrowserStyles.manageTagOrderControls}>
                      <button
                        className={recipeBrowserStyles.manageTagIconButton(theme)}
                        disabled={isManagingTags}
                        type="button"
                        aria-label={t.common.moveUp}
                        onClick={() => void moveTag(tag.id, "Up")}
                      >
                        ^
                      </button>
                      <button
                        className={recipeBrowserStyles.manageTagIconButton(theme)}
                        disabled={isManagingTags}
                        type="button"
                        aria-label={t.common.moveDown}
                        onClick={() => void moveTag(tag.id, "Down")}
                      >
                        v
                      </button>
                    </div>
                    <input
                      className={recipeBrowserStyles.manageTagTextField(theme)}
                      value={managedTagNames[tag.name] ?? tag.name}
                      onChange={(event) =>
                        setManagedTagNames((currentNames) => ({
                          ...currentNames,
                          [tag.name]: event.target.value,
                        }))
                      }
                    />
                    <button
                      className={recipeBrowserStyles.manageTagActionButton(theme)}
                      disabled={isManagingTags}
                      type="button"
                      onClick={() => void updateManagedTag(tag.name)}
                    >
                      {t.common.save}
                    </button>
                    <button
                      className={recipeBrowserStyles.manageTagRemoveButton(theme)}
                      disabled={isManagingTags}
                      type="button"
                      onClick={() => void deleteManagedTag(tag.name)}
                    >
                      {t.common.remove}
                    </button>
                  </div>
                ))}
              </div>}
              </section>
            </div>
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
                  {categories.filter((category) => category.id > 0).map((category) => (
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

function ManageTagChevron() {
  return (
    <svg aria-hidden="true" className={recipeBrowserStyles.manageTagCollapseSvg} viewBox="0 0 24 24">
      <path d="M8.6 4.6 16 12l-7.4 7.4-1.4-1.4 6-6-6-6 1.4-1.4Z" />
    </svg>
  );
}
