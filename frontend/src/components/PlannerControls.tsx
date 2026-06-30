import { plannerControlsStyles, type SiteTheme } from "../styles/appStyles";

type PlannerControlsProps = {
  theme?: SiteTheme;
};

function PlannerControls({ theme = "dark" }: PlannerControlsProps) {
  const weekInfo = getCurrentWeekInfo();

  return (
    <section className={plannerControlsStyles.shell} aria-label="Planner controls">
      <div className={plannerControlsStyles.leftCell}>
        <div className={plannerControlsStyles.counterActions}>
          <div className={plannerControlsStyles.actionSlotLeft}>
            <button aria-label="Clear meals" className={plannerControlsStyles.iconOnlyButton(theme)} type="button">
              <ClearIcon />
              <span className={plannerControlsStyles.tooltip(theme)}>Clear meals</span>
            </button>
          </div>
          <div className={plannerControlsStyles.actionSlotCenter}>
            <button
              aria-label="Generate meal plan"
              className={plannerControlsStyles.iconOnlyButton(theme)}
              type="button"
            >
              <GenerateIcon />
              <span className={plannerControlsStyles.tooltip(theme)}>Generate meal plan</span>
            </button>
          </div>
          <div className={plannerControlsStyles.actionSlotRight}>
            <button
              aria-label="Export grocery list"
              className={plannerControlsStyles.iconOnlyButton(theme)}
              type="button"
            >
              <ExportIcon />
              <span className={plannerControlsStyles.tooltip(theme)}>Export grocery list</span>
            </button>
          </div>
        </div>
      </div>
      <div className={plannerControlsStyles.centerCell}>
        <div className={plannerControlsStyles.datePrimaryRow}>
          <button
            aria-label="Previous week"
            className={plannerControlsStyles.iconButton(theme)}
            type="button"
          >
            <ArrowIcon direction="left" />
          </button>
          <div className={plannerControlsStyles.datePrimary(theme)}>Week {weekInfo.week}</div>
          <button aria-label="Next week" className={plannerControlsStyles.iconButton(theme)} type="button">
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
      <div className={plannerControlsStyles.rightCell}>
        <div className={plannerControlsStyles.viewToggle(theme)} role="group" aria-label="Planner view">
          <button className={plannerControlsStyles.viewToggleOption(theme, true)} type="button">
            Week
          </button>
          <button className={plannerControlsStyles.viewToggleOption(theme, false)} type="button">
            Month
          </button>
        </div>
      </div>
    </section>
  );
}

function getCurrentWeekInfo() {
  const today = new Date();
  const week = getIsoWeek(today);

  return {
    week: String(week),
  };
}

function getIsoWeek(date: Date) {
  const nextDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = nextDate.getUTCDay() || 7;
  nextDate.setUTCDate(nextDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(nextDate.getUTCFullYear(), 0, 1));

  return Math.ceil(((nextDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
