import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLanguage } from "../contexts";
import type { IGroceryList, IGroceryListItem } from "../interfaces/IGroceryList";
import { ApiError, groceryListService } from "../services";
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
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [selectedItemKeys, setSelectedItemKeys] = useState(() => getInitialSelectedKeys(groceryList));
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success">("idle");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedItemKeys(getInitialSelectedKeys(groceryList));
    setExportStatus("idle");
    setExportMessage(null);
    setExportError(null);
  }, [groceryList]);

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

  return (
    <Modal
      backdropClassName={groceryExportStyles.modalBackdrop}
      describedBy={descriptionId}
      labelledBy={titleId}
      panelClassName={groceryExportStyles.modalPanel(theme)}
      onClose={onClose}
    >
        <div className={groceryExportStyles.header}>
          <div>
            <h2 className={groceryExportStyles.title} id={titleId}>{t.planner.groceryExportTitle}</h2>
            <p className={groceryExportStyles.subtitle(theme)} id={descriptionId}>
              {t.planner.groceryExportDescription}
            </p>
          </div>
          <button
            aria-label={t.common.close}
            className={groceryExportStyles.closeButton(theme)}
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
          >
            x
          </button>
        </div>

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

        <div className={groceryExportStyles.footer}>
          <p className={groceryExportStyles.countText(theme)}>
            {t.planner.groceryExportSelectedCount(selectedCount, itemCount)}
          </p>
          <div className={groceryExportStyles.actionGroup}>
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
        </div>
    </Modal>
  );
}

function getInitialSelectedKeys(groceryList: IGroceryList) {
  return new Set(
    groceryList.sections.flatMap((section) =>
      section.items.map((item) => getItemKey(section.name, item)),
    ),
  );
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
