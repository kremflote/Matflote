import { mealCalendarStyles, type SiteTheme } from "../styles/appStyles";
import MealSlot from "./MealSlot";

type MealCalendarProps = {
  theme?: SiteTheme;
};

const meals = ["BREAKFAST", "LUNCH", "DINNER"] as const;
const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

function MealCalendar({ theme = "dark" }: MealCalendarProps) {
  return (
    <section className={mealCalendarStyles.shell} aria-label="Meal calendar">
      <div className={mealCalendarStyles.grid}>
        {meals.map((meal) => (
          <div
            className={`${mealCalendarStyles.headerCell(theme)} ${mealCalendarStyles.headerCellSpan}`}
            key={meal}
          >
            {meal}
          </div>
        ))}
      </div>

      <div className={mealCalendarStyles.rows}>
        {days.map((day) => (
          <div className={mealCalendarStyles.row} key={day}>
            <div className={mealCalendarStyles.dayCell(theme)}>
              <span className={mealCalendarStyles.dayLabel}>{day}</span>
            </div>
            <div className={mealCalendarStyles.grid}>
              {meals.map((meal) => (
                <MealSlot key={`${day}-${meal}`} theme={theme} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default MealCalendar;
