import MealCalendar from "../components/MealCalendar";
import PlannerControls from "../components/PlannerControls";
import { pageStyles, type SiteTheme } from "../styles/appStyles";

type PlannerPageProps = {
  theme: SiteTheme;
};

const PlannerPage = ({ theme }: PlannerPageProps) => {
  return (
    <main className={pageStyles.shell}>
      {pageStyles.showColumnDebugOverlay && (
        <div className={pageStyles.columnDebugOverlay} aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <div className={pageStyles.columnDebugCell} key={index} />
          ))}
        </div>
      )}
      <PlannerControls theme={theme} />
      <MealCalendar theme={theme} />
    </main>
  );
};

export default PlannerPage;
