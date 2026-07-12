import { useLanguage } from "../contexts";
import type { PlannerViewMode } from "../interfaces/IMeal";
import { plannerControlsStyles, type SiteTheme } from "../styles/appStyles";

type PlannerControlsProps = {
  anchorLabel: string;
  anchorYear: string;
  isClearRangeRunning?: boolean;
  isExportRangeRunning?: boolean;
  isGenerateRangeRunning?: boolean;
  isRangeBusy?: boolean;
  theme?: SiteTheme;
  viewMode: PlannerViewMode;
  onNextRange: () => void;
  onPreviousRange: () => void;
  onClearRange: () => void | Promise<void>;
  onExportRange: () => void | Promise<void>;
  onGenerateRange: () => void | Promise<void>;
  onViewModeChange: (value: PlannerViewMode) => void;
};

function PlannerControls({
  anchorLabel,
  anchorYear,
  isClearRangeRunning = false,
  isExportRangeRunning = false,
  isGenerateRangeRunning = false,
  isRangeBusy = false,
  theme = "dark",
  viewMode,
  onNextRange,
  onPreviousRange,
  onClearRange,
  onExportRange,
  onGenerateRange,
  onViewModeChange,
}: PlannerControlsProps) {
  const { t } = useLanguage();
  const rangeLabel = t.planner.rangeNames[viewMode];

  return (
    <section className={plannerControlsStyles.shell} aria-label={t.planner.plannerControls}>
      <div className={plannerControlsStyles.leftCell}>
        <div className={plannerControlsStyles.counterActions}>
          <div className={plannerControlsStyles.actionSlotLeft}>
            <button
              aria-label={t.planner.clearCurrent(rangeLabel)}
              className={plannerControlsStyles.iconOnlyButton(theme)}
              disabled={isRangeBusy || isGenerateRangeRunning || isClearRangeRunning}
              type="button"
              onClick={onClearRange}
            >
              <ClearIcon />
              <span className={plannerControlsStyles.tooltip(theme)}>
                {isClearRangeRunning ? t.planner.clearing : t.planner.clearCurrent(rangeLabel)}
              </span>
            </button>
          </div>
          <div className={plannerControlsStyles.actionSlotCenter}>
            <button
              aria-label={t.planner.generateMealPlan}
              className={plannerControlsStyles.iconOnlyButton(theme)}
              disabled={isRangeBusy || isGenerateRangeRunning || isClearRangeRunning}
              type="button"
              onClick={onGenerateRange}
            >
              <GenerateIcon />
              <span className={plannerControlsStyles.tooltip(theme)}>
                {isGenerateRangeRunning ? t.planner.generating : t.planner.generateMealPlan}
              </span>
            </button>
          </div>
          <div className={plannerControlsStyles.actionSlotRight}>
            <button
              aria-label={t.planner.exportGroceryList}
              className={plannerControlsStyles.iconOnlyButton(theme)}
              disabled={isRangeBusy || isGenerateRangeRunning || isClearRangeRunning || isExportRangeRunning}
              type="button"
              onClick={onExportRange}
            >
              <ExportIcon />
              <span className={plannerControlsStyles.tooltip(theme)}>
                {isExportRangeRunning ? t.planner.groceryExportLoading : t.planner.exportGroceryList}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className={plannerControlsStyles.centerCell}>
        <time
          aria-label={t.planner.yearLabel(anchorYear)}
          className={plannerControlsStyles.dateYearRow(theme)}
          dateTime={anchorYear}
        >
          {anchorYear}
        </time>
        <div className={plannerControlsStyles.datePrimaryRow}>
          <button
            aria-label={t.planner.previousRange(rangeLabel)}
            className={plannerControlsStyles.iconButton(theme)}
            disabled={isClearRangeRunning || isGenerateRangeRunning}
            type="button"
            onClick={onPreviousRange}
          >
            <ArrowIcon direction="left" />
          </button>
          <div className={plannerControlsStyles.datePrimary(theme)}>{anchorLabel}</div>
          <button
            aria-label={t.planner.nextRange(rangeLabel)}
            className={plannerControlsStyles.iconButton(theme)}
            disabled={isClearRangeRunning || isGenerateRangeRunning}
            type="button"
            onClick={onNextRange}
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
      <div className={plannerControlsStyles.rightCell}>
        <div className={plannerControlsStyles.viewToggle(theme)} role="group" aria-label={t.planner.plannerView}>
          <button
            aria-pressed={viewMode === "week"}
            className={plannerControlsStyles.viewToggleOption(theme, viewMode === "week")}
            disabled={isClearRangeRunning || isGenerateRangeRunning}
            type="button"
            onClick={() => onViewModeChange("week")}
          >
            {t.enums.viewModes.week}
          </button>
          <button
            aria-pressed={viewMode === "month"}
            className={plannerControlsStyles.viewToggleOption(theme, viewMode === "month")}
            disabled={isClearRangeRunning || isGenerateRangeRunning}
            type="button"
            onClick={() => onViewModeChange("month")}
          >
            {t.enums.viewModes.month}
          </button>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className={plannerControlsStyles.buttonIcon} viewBox="0 0 24 24">
      {direction === "left" ? (
        <path d="M14.7 5.3 8 12l6.7 6.7 1.4-1.4L10.8 12l5.3-5.3-1.4-1.4Z" />
      ) : (
        <path d="m9.3 18.7 6.7-6.7-6.7-6.7-1.4 1.4 5.3 5.3-5.3 5.3 1.4 1.4Z" />
      )}
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg aria-hidden="true" className={plannerControlsStyles.buttonIcon} viewBox="0 0 24 24">
      <path d="M7 21a2 2 0 0 1-2-2V8h14v11a2 2 0 0 1-2 2H7ZM4 5h5l1-2h4l1 2h5v2H4V5Zm4 5v8h2v-8H8Zm6 0v8h2v-8h-2Z" />
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg aria-hidden="true" className={plannerControlsStyles.buttonIcon} viewBox="0 0 24 24">
      <path d="M12 2 9.8 7.4 4 8l4.4 3.8L7.1 17.5 12 14.5l4.9 3-1.3-5.7L20 8l-5.8-.6L12 2Zm0 5.2.8 2.1 2.2.2-1.7 1.5.5 2.1-1.8-1.1-1.8 1.1.5-2.1L9 9.5l2.2-.2.8-2.1ZM4 19h16v2H4v-2Z" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg aria-hidden="true" className={plannerControlsStyles.buttonIcon} viewBox="0 0 24 24">
      <path d="M12 3 7.5 7.5l1.4 1.4 2.1-2.1V15h2V6.8l2.1 2.1 1.4-1.4L12 3Zm-7 9h2v7h10v-7h2v9H5v-9Z" />
    </svg>
  );
}

export default PlannerControls;
