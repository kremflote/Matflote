import { useId } from "react";
import { useLanguage } from "../contexts";
import type { MeasurementUnit } from "../interfaces/IIngredient";
import { prepHelperStyles } from "../styles/appStyles";
import type { PrepHelperItem } from "../utils/plannerPrepHelper";
import Modal from "./Modal";

type PrepHelperDialogProps = {
  from: string;
  items: PrepHelperItem[];
  to: string;
  onClose: () => void;
};

function PrepHelperDialog({
  from,
  items,
  to,
  onClose,
}: PrepHelperDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const descriptionId = useId();
  return (
    <Modal
      backdropClassName={prepHelperStyles.modalBackdrop}
      bodyClassName={prepHelperStyles.bodyFrame}
      closeButtonClassName={prepHelperStyles.closeButton}
      closeLabel={t.common.close}
      description={t.planner.prepHelperDescription(from, to)}
      descriptionClassName={prepHelperStyles.subtitle}
      descriptionId={descriptionId}
      footer={
        <button
          className={prepHelperStyles.secondaryButton}
          type="button"
          onClick={onClose}
        >
          {t.common.close}
        </button>
      }
      footerClassName={prepHelperStyles.footer}
      headerClassName={prepHelperStyles.header}
      panelClassName={prepHelperStyles.modalPanel}
      title={t.planner.prepHelperTitle}
      titleClassName={prepHelperStyles.title}
      titleId={titleId}
      onClose={onClose}
    >
        {items.length === 0 ? (
          <div className={prepHelperStyles.emptyState}>
            {t.planner.prepHelperEmpty}
          </div>
        ) : (
          <div className={prepHelperStyles.list}>
            {items.map((item) => (
              <article
                className={prepHelperStyles.item}
                key={`${item.ingredientId}::${item.unit}`}
              >
                <div className={prepHelperStyles.itemHeader}>
                  <div>
                    <h3 className={prepHelperStyles.itemName}>{item.ingredientName}</h3>
                    <p className={prepHelperStyles.sourceText}>
                      {t.planner.prepHelperSources(item.sources.join(", "))}
                    </p>
                  </div>
                  <span className={prepHelperStyles.itemAmount}>
                    {formatAmount(item.amount, item.unit, t.enums.measurementUnits)}
                  </span>
                </div>
                <div className={prepHelperStyles.actionList}>
                  {item.actions.map((action) => (
                    <span className={prepHelperStyles.actionChip} key={action}>
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
  if (amount === null) {
    return "";
  }

  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unitLabels[unit].toLowerCase()}`;
}

export default PrepHelperDialog;
