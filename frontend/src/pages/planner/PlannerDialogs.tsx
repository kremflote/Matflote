// The planner page's confirmations that ask for a number: clearing or generating the visible range, and moving a meal.

import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useLanguage } from "../../contexts";
import { confirmationDialogStyles } from "../../styles/confirmationDialogStyles";
import { normalizeMoveValue, normalizePeopleEating, type PendingMealMove } from "./plannerMeals";

type RangeActionDialogProps = {
  action: "clear" | "generate";
  /** "week" or "month", as the planner names its range in sentences. */
  rangeName: string;
  peopleEating: number;
  isBusy: boolean;
  onPeopleEatingChange: (peopleEating: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RangeActionDialog({
  action,
  rangeName,
  peopleEating,
  isBusy,
  onPeopleEatingChange,
  onCancel,
  onConfirm,
}: RangeActionDialogProps) {
  const { t } = useLanguage();

  return (
    <ConfirmationDialog
      body={
        action === "clear"
          ? t.planner.clearRangeBody(rangeName)
          : (
              <>
                <p>{t.planner.generateRangeBody(rangeName)}</p>
                <div className={confirmationDialogStyles.settingsGroup}>
                  <label className={confirmationDialogStyles.fieldLabel}>
                    <span className={confirmationDialogStyles.fieldTitle}>
                      {t.planner.peopleEatingThisWeek}
                    </span>
                    <input
                      className={confirmationDialogStyles.numberInput}
                      min={1}
                      step={1}
                      type="number"
                      value={peopleEating}
                      onChange={(event) => onPeopleEatingChange(normalizePeopleEating(Number(event.currentTarget.value)))}
                    />
                  </label>
                </div>
              </>
            )
      }
      confirmLabel={action === "clear" ? t.common.clear : t.planner.generateMealPlan}
      isBusy={isBusy}
      title={action === "clear" ? t.planner.clearRange(rangeName) : t.planner.generateCurrent(rangeName)}
      tone={action === "clear" ? "danger" : "default"}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

type MoveMealDialogProps = {
  move: PendingMealMove;
  isBusy: boolean;
  onValueChange: (value: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function MoveMealDialog({ move, isBusy, onValueChange, onCancel, onConfirm }: MoveMealDialogProps) {
  const { t } = useLanguage();

  return (
    <ConfirmationDialog
      body={
        <>
          <p>{t.planner.moveMealBody(move.label)}</p>
          {move.amountKind !== "none" && (
            <div className={confirmationDialogStyles.settingsGroup}>
              <label className={confirmationDialogStyles.fieldLabel}>
                <span className={confirmationDialogStyles.fieldTitle}>
                  {move.amountKind === "portions"
                    ? t.planner.moveMealPortionsLabel
                    : t.planner.moveMealAmountLabel(move.unit === null ? "" : t.enums.measurementUnits[move.unit])}
                </span>
                <input
                  className={confirmationDialogStyles.numberInput}
                  max={move.maxValue}
                  min={1}
                  step={1}
                  type="number"
                  value={move.value}
                  onChange={(event) => onValueChange(normalizeMoveValue(Number(event.currentTarget.value), move.maxValue))}
                />
              </label>
            </div>
          )}
        </>
      }
      confirmLabel={t.planner.moveMealConfirm}
      isBusy={isBusy}
      title={t.planner.moveMealTitle}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
