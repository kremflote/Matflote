import { useEffect, useId, useRef } from "react";
import { useLanguage } from "../contexts";
import type { MeasurementUnit } from "../interfaces/IIngredient";
import { prepHelperStyles, type SiteTheme } from "../styles/appStyles";
import type { PrepHelperItem } from "../utils/plannerPrepHelper";
import Modal from "./Modal";

type PrepHelperDialogProps = {
  from: string;
  items: PrepHelperItem[];
  theme: SiteTheme;
  to: string;
  onClose: () => void;
};

function PrepHelperDialog({
  from,
  items,
  theme,
  to,
  onClose,
}: PrepHelperDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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

  return (
    <Modal
      backdropClassName={prepHelperStyles.modalBackdrop}
      bodyClassName={prepHelperStyles.bodyFrame}
      closeButtonClassName={prepHelperStyles.closeButton(theme)}
      closeButtonRef={closeButtonRef}
      closeLabel={t.common.close}
      description={t.planner.prepHelperDescription(from, to)}
      descriptionClassName={prepHelperStyles.subtitle(theme)}
      descriptionId={descriptionId}
      footer={
        <button
          className={prepHelperStyles.secondaryButton(theme)}
          type="button"
          onClick={onClose}
        >
          {t.common.close}
        </button>
      }
      footerClassName={prepHelperStyles.footer}
      headerClassName={prepHelperStyles.header}
      panelClassName={prepHelperStyles.modalPanel(theme)}
      title={t.planner.prepHelperTitle}
      titleClassName={prepHelperStyles.title}
      titleId={titleId}
      onClose={onClose}
    >
        {items.length === 0 ? (
          <div className={prepHelperStyles.emptyState(theme)}>
            {t.planner.prepHelperEmpty}
          </div>
        ) : (
          <div className={prepHelperStyles.list}>
            {items.map((item) => (
              <article
                className={prepHelperStyles.item(theme)}
                key={`${item.ingredientId}::${item.unit}`}
              >
                <div className={prepHelperStyles.itemHeader}>
                  <div>
                    <h3 className={prepHelperStyles.itemName}>{item.ingredientName}</h3>
                    <p className={prepHelperStyles.sourceText(theme)}>
                      {t.planner.prepHelperSources(item.sources.join(", "))}
                    </p>
                  </div>
                  <span className={prepHelperStyles.itemAmount}>
                    {formatAmount(item.amount, item.unit, t.enums.measurementUnits)}
                  </span>
                </div>
                <div className={prepHelperStyles.actionList}>
                  {item.actions.map((action) => (
                    <span className={prepHelperStyles.actionChip(theme)} key={action}>
                      {action}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
    </Modal>
  );
}

function formatAmount(
  amount: number | null,
  unit: MeasurementUnit,
  unitLabels: Record<MeasurementUnit, string>,
) {
  if (amount === null || unit === "ToTaste") {
    return unitLabels.ToTaste;
  }

  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unitLabels[unit].toLowerCase()}`;
}

export default PrepHelperDialog;
