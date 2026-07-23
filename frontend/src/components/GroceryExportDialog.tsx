import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useIngredientTagCategories, useLanguage } from "../contexts";
import type { IGroceryList, IGroceryListItem } from "../interfaces/IGroceryList";
import { ApiError, appSettingsService, groceryListService } from "../services";
import { groceryExportStyles, type SiteTheme } from "../styles/appStyles";
import Modal from "./Modal";

type GroceryExportDialogProps = {
  groceryList: IGroceryList;
  isLoading: boolean;
  loadError: string | null;
  theme: SiteTheme;
  onClose: () => void;
};

function GroceryExportDialog({
  groceryList,
  isLoading,
  loadError,
  theme,
  onClose,
}: GroceryExportDialogProps) {
  const { t } = useLanguage();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [defaultExcludedTags, setDefaultExcludedTags] = useState<string[]>(["Spice"]);
  const [draftExcludedTags, setDraftExcludedTags] = useState<string[]>(["Spice"]);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isRulesSaving, setIsRulesSaving] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [selectedItemKeys, setSelectedItemKeys] = useState(() => getInitialSelectedKeys(groceryList, defaultExcludedTags));
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success">("idle");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedItemKeys(getInitialSelectedKeys(groceryList, defaultExcludedTags));
    setExportStatus("idle");
    setExportMessage(null);
    setExportError(null);
  }, [defaultExcludedTags, groceryList]);

  useEffect(() => {
    let ignore = false;

    const loadRules = async () => {
      try {
        const settings = await appSettingsService.get();
        if (ignore) {
          return;
        }

        const tags = settings.shoppingListExport.defaultExcludedIngredientTags;
        setDefaultExcludedTags(tags.length === 0 ? ["Spice"] : tags);
        setDraftExcludedTags(tags.length === 0 ? ["Spice"] : tags);
      } catch {
        if (!ignore) {
          setDefaultExcludedTags(["Spice"]);
          setDraftExcludedTags(["Spice"]);
        }
      }
    };

    void loadRules();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedCount = selectedItemKeys.size;
  const itemCount = useMemo(
    () => groceryList.sections.reduce((count, section) => count + section.items.length, 0),
    [groceryList.sections],
  );
  const selectedGroceryList = useMemo(
    () => getSelectedGroceryList(groceryList, selectedItemKeys),
    [groceryList, selectedItemKeys],
  );
  const availableRuleTags = useMemo(
    () => getAvailableRuleTags(ingredientTagCategories, groceryList, defaultExcludedTags),
    [defaultExcludedTags, groceryList, ingredientTagCategories],
  );

  const toggleItem = (sectionName: string, item: IGroceryListItem) => {
    const itemKey = getItemKey(sectionName, item);

    setSelectedItemKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);

      if (nextKeys.has(itemKey)) {
        nextKeys.delete(itemKey);
      } else {
        nextKeys.add(itemKey);
      }

      return nextKeys;
    });

    setExportStatus("idle");
    setExportMessage(null);
    setExportError(null);
  };

  const exportSelectedItems = async () => {
    if (selectedCount === 0 || exportStatus === "exporting") {
      return;
    }

    setExportStatus("exporting");
    setExportError(null);
    setExportMessage(null);

    try {
      await groceryListService.exportSelected(selectedGroceryList);
      setExportStatus("success");
      setExportMessage(t.planner.groceryExportSent);
    } catch (error) {
      setExportStatus("idle");
      setExportError(getExportErrorMessage(error, t.planner.groceryExportCouldNotSend));
    }
  };

  const openRules = () => {
    setDraftExcludedTags(defaultExcludedTags);
    setRulesError(null);
    setIsRulesOpen(true);
  };

  const saveRules = async () => {
    setIsRulesSaving(true);
    setRulesError(null);

    try {
      const settings = await appSettingsService.updateGroceryExportRules(draftExcludedTags);
      const tags = settings.shoppingListExport.defaultExcludedIngredientTags;
      setDefaultExcludedTags(tags);
      setDraftExcludedTags(tags);
      setIsRulesOpen(false);
    } catch (error) {
      setRulesError(getExportErrorMessage(error, t.planner.groceryExportRulesCouldNotSave));
    } finally {
      setIsRulesSaving(false);
    }
  };

  return (
    <Modal
      backdropClassName={groceryExportStyles.modalBackdrop}
      bodyClassName={groceryExportStyles.bodyFrame}
      closeButtonClassName={groceryExportStyles.closeButton(theme)}
      closeButtonRef={closeButtonRef}
      closeLabel={t.common.close}
      description={t.planner.groceryExportDescription}
      descriptionClassName={groceryExportStyles.subtitle(theme)}
      descriptionId={descriptionId}
      footer={
        <>
          <p className={groceryExportStyles.countText(theme)}>
            {t.planner.groceryExportSelectedCount(selectedCount, itemCount)}
          </p>
          <div className={groceryExportStyles.actionGroup}>
            <button
              className={groceryExportStyles.secondaryButton(theme)}
              disabled={exportStatus === "exporting"}
              type="button"
              onClick={openRules}
            >
              {t.planner.groceryExportManageRules}
            </button>
            <button
              className={groceryExportStyles.secondaryButton(theme)}
              disabled={exportStatus === "exporting"}
              type="button"
              onClick={onClose}
            >
              {t.common.cancel}
            </button>
            <button
              className={groceryExportStyles.primaryButton(theme)}
              disabled={isLoading || loadError !== null || selectedCount === 0 || exportStatus === "exporting"}
              type="button"
              onClick={() => void exportSelectedItems()}
            >
              {exportStatus === "exporting" ? t.planner.groceryExportSending : t.planner.groceryExportSend}
            </button>
          </div>
        </>
      }
      footerClassName={groceryExportStyles.footer}
      headerClassName={groceryExportStyles.header}
      panelClassName={groceryExportStyles.modalPanel(theme)}
      title={t.planner.groceryExportTitle}
      titleClassName={groceryExportStyles.title}
      titleId={titleId}
      onClose={onClose}
    >
        {isLoading && (
          <div className={groceryExportStyles.emptyState(theme)}>{t.planner.groceryExportLoading}</div>
        )}
        {!isLoading && loadError !== null && (
          <p className={groceryExportStyles.statusError(theme)}>{loadError}</p>
        )}
        {!isLoading && loadError === null && itemCount === 0 && (
          <div className={groceryExportStyles.emptyState(theme)}>{t.planner.groceryExportEmpty}</div>
        )}
        {!isLoading && loadError === null && itemCount > 0 && (
          <div className={groceryExportStyles.list}>
            {groceryList.sections.map((section) => (
              <section className={groceryExportStyles.section(theme)} key={section.name}>
                <h3 className={groceryExportStyles.sectionTitle(theme)}>
                  {t.planner.groceryExportSections[section.name] ?? section.name}
                </h3>
                {section.items.map((item) => {
                  const itemKey = getItemKey(section.name, item);
                  const selected = selectedItemKeys.has(itemKey);

                  return (
                    <button
                      aria-pressed={selected}
                      className={groceryExportStyles.itemButton(theme, selected)}
                      key={itemKey}
                      type="button"
                      onClick={() => toggleItem(section.name, item)}
                    >
                      <span className={groceryExportStyles.checkbox(theme, selected)} aria-hidden="true">
                        ✓
                      </span>
                      <span className={groceryExportStyles.itemText}>
                        <span className={groceryExportStyles.itemName}>{item.ingredientName}</span>
                        {item.sourceRecipes.length > 0 && (
                          <span className={groceryExportStyles.itemSources(theme)}>
                            {t.planner.groceryExportSources(item.sourceRecipes.join(", "))}
                          </span>
                        )}
                      </span>
                      <span className={groceryExportStyles.itemAmount}>{item.displayAmount}</span>
                    </button>
                  );
                })}
              </section>
            ))}
          </div>
        )}

        {exportError !== null && (
          <p className={groceryExportStyles.statusError(theme)}>{exportError}</p>
        )}
        {exportMessage !== null && (
          <p className={groceryExportStyles.statusSuccess(theme)}>{exportMessage}</p>
        )}
        {isRulesOpen && (
          <GroceryExportRulesDialog
            availableTags={availableRuleTags}
            excludedTags={draftExcludedTags}
            isSaving={isRulesSaving}
            rulesError={rulesError}
            theme={theme}
            onCancel={() => setIsRulesOpen(false)}
            onSave={() => void saveRules()}
            onToggleTag={(tag) => setDraftExcludedTags((currentTags) => toggleTag(currentTags, tag))}
          />
        )}
    </Modal>
  );
}

type GroceryExportRulesDialogProps = {
  availableTags: string[];
  excludedTags: string[];
  isSaving: boolean;
  rulesError: string | null;
  theme: SiteTheme;
  onCancel: () => void;
  onSave: () => void;
  onToggleTag: (tag: string) => void;
};

function GroceryExportRulesDialog({
  availableTags,
  excludedTags,
  isSaving,
  rulesError,
  theme,
  onCancel,
  onSave,
  onToggleTag,
}: GroceryExportRulesDialogProps) {
  const { t } = useLanguage();

  return (
    <Modal
      backdropClassName={groceryExportStyles.rulesBackdrop}
      bodyClassName={groceryExportStyles.rulesBody}
      closeButtonClassName={groceryExportStyles.closeButton(theme)}
      closeLabel={t.common.close}
      footer={
        <>
          <button className={groceryExportStyles.secondaryButton(theme)} disabled={isSaving} type="button" onClick={onCancel}>
            {t.common.cancel}
          </button>
          <button className={groceryExportStyles.primaryButton(theme)} disabled={isSaving} type="button" onClick={onSave}>
            {isSaving ? t.common.saving : t.common.save}
          </button>
        </>
      }
      footerClassName={groceryExportStyles.rulesFooter}
      headerClassName={groceryExportStyles.header}
      panelClassName={groceryExportStyles.rulesPanel(theme)}
      title={t.planner.groceryExportRulesTitle}
      titleClassName={groceryExportStyles.title}
      onClose={onCancel}
    >
      <p className={groceryExportStyles.subtitle(theme)}>{t.planner.groceryExportRulesDescription}</p>
      <div className={groceryExportStyles.ruleTagGrid}>
        {availableTags.map((tag) => {
          const selected = excludedTags.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase());

          return (
            <button
              aria-pressed={selected}
              className={groceryExportStyles.ruleTagButton(theme, selected)}
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
            >
              {t.enums.ingredientTags[tag] ?? tag}
            </button>
          );
        })}
      </div>
      {rulesError !== null && (
        <p className={groceryExportStyles.statusError(theme)}>{rulesError}</p>
      )}
    </Modal>
  );
}

function getInitialSelectedKeys(groceryList: IGroceryList, excludedTags: string[]) {
  const excludedTagSet = new Set(excludedTags.map((tag) => tag.toLowerCase()));

  return new Set(
    groceryList.sections.flatMap((section) =>
      section.items
        .filter((item) => !item.tags.some((tag) => excludedTagSet.has(tag.toLowerCase())))
        .map((item) => getItemKey(section.name, item)),
    ),
  );
}

function getAvailableRuleTags(
  ingredientTagCategories: Array<{ tags: string[] }>,
  groceryList: IGroceryList,
  excludedTags: string[],
) {
  const categoryTags = ingredientTagCategories.flatMap((category) => category.tags);
  const fallbackPreviewTags = groceryList.sections.flatMap((section) => section.items.flatMap((item) => item.tags));
  const sourceTags = categoryTags.length > 0 ? categoryTags : fallbackPreviewTags;

  return Array.from(new Set([...sourceTags, ...excludedTags]))
    .sort((left, right) => left.localeCompare(right));
}

function toggleTag(tags: string[], tag: string) {
  return tags.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase())
    ? tags.filter((currentTag) => currentTag.toLowerCase() !== tag.toLowerCase())
    : [...tags, tag].sort((left, right) => left.localeCompare(right));
}

function getItemKey(sectionName: string, item: IGroceryListItem) {
  return `${sectionName}::${item.ingredientId}::${item.unit}`;
}

function getSelectedGroceryList(groceryList: IGroceryList, selectedItemKeys: Set<string>): IGroceryList {
  return {
    ...groceryList,
    sections: groceryList.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => selectedItemKeys.has(getItemKey(section.name, item))),
      }))
      .filter((section) => section.items.length > 0),
  };
}

function getExportErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError && error.message.trim().length > 0) {
    return `${fallbackMessage} ${error.message}`;
  }

  return fallbackMessage;
}

export default GroceryExportDialog;
