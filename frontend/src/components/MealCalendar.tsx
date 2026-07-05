import { mealCalendarStyles, type SiteTheme } from "../styles/appStyles";
import type { IMealPlanEntry, MealSlot as MealSlotId, PlannerViewMode } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import MealSlot from "./MealSlot";

type MealCalendarProps = {
  anchorDate: Date;
  dates: Date[];
  getEntryForSlot: (date: string, slot: MealSlotId) => IMealPlanEntry | undefined;
  isLoading: boolean;
  loadError: string | null;
  mealSlots: MealSlotId[];
  onSlotClick: (date: string, slot: MealSlotId) => void;
  recipesById: Map<number, IRecipe>;
  theme?: SiteTheme;
  viewMode: PlannerViewMode;
};

const weekDayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

function MealCalendar({
  anchorDate,
  dates,
  getEntryForSlot,
  isLoading,
  loadError,
  mealSlots,
  onSlotClick,
  recipesById,
  theme = "dark",
  viewMode,
}: MealCalendarProps) {
  if (viewMode === "month") {
    return (
      <section className={mealCalendarStyles.shell} aria-busy={isLoading} aria-label="Meal calendar">
        <div className={mealCalendarStyles.monthGrid}>
          {weekDayLabels.map((day) => (
            <div className={mealCalendarStyles.monthHeaderCell(theme)} key={day}>
              {day}
            </div>
          ))}
        </div>
        <div className={`${mealCalendarStyles.monthGrid} mt-3`}>
          {dates.map((date) => {
            const dateKey = toDateInputValue(date);
            const dayEntries = mealSlots
              .map((slot) => ({ slot, entry: getEntryForSlot(dateKey, slot) }))
              .filter((item): item is { slot: MealSlotId; entry: IMealPlanEntry } => item.entry !== undefined);

            return (
              <div
                className={mealCalendarStyles.monthDayCell(theme, date.getMonth() !== anchorDate.getMonth())}
                key={dateKey}
              >
                <div className={mealCalendarStyles.monthDayNumber(theme)}>{date.getDate()}</div>
                <div className={mealCalendarStyles.monthDayMeals}>
                  {dayEntries.map(({ slot, entry }) => (
                    <MonthMealSummary
                      entry={entry}
                      key={`${dateKey}-${slot}`}
                      recipesById={recipesById}
                      slot={slot}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {loadError !== null && (
          <p className={mealCalendarStyles.mealSlotStatus(theme)}>{loadError}</p>
        )}
      </section>
    );
  }

  return (
    <section className={mealCalendarStyles.shell} aria-busy={isLoading} aria-label="Meal calendar">
      {/* Meal labels are hidden for now.
      <div className={mealCalendarStyles.grid}>
        {mealSlots.map((meal) => (
          <div
            className={`${mealCalendarStyles.headerCell(theme)} ${mealCalendarStyles.headerCellSpan}`}
            key={meal}
          >
            {meal}
          </div>
        ))}
      </div>
      */}

      <div className={mealCalendarStyles.rows}>
        {dates.map((date, index) => {
          const dateKey = toDateInputValue(date);

          return (
            <div className={mealCalendarStyles.row} key={dateKey}>
              <div className={mealCalendarStyles.dayCell(theme)}>
                <span className={mealCalendarStyles.dayLabel}>{weekDayLabels[index] ?? ""}</span>
              </div>
              <div className={mealCalendarStyles.grid}>
                {mealSlots.map((meal) => (
                  <MealSlot
                    entry={getEntryForSlot(dateKey, meal)}
                    key={`${dateKey}-${meal}`}
                    onClick={() => onSlotClick(dateKey, meal)}
                    recipesById={recipesById}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {loadError !== null && (
        <p className={mealCalendarStyles.mealSlotStatus(theme)}>{loadError}</p>
      )}
    </section>
  );
}

type MonthMealSummaryProps = {
  entry: IMealPlanEntry;
  recipesById: Map<number, IRecipe>;
  slot: MealSlotId;
  theme: SiteTheme;
};

function MonthMealSummary({ entry, recipesById, slot, theme }: MonthMealSummaryProps) {
  const firstRecipe = entry.recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)[0];
  const recipe = firstRecipe ? recipesById.get(firstRecipe.recipeId) : undefined;
  const extraCount = Math.max(entry.recipes.length - 1, 0);
  const label = recipe?.name ?? (firstRecipe ? `Recipe ${firstRecipe.recipeId}` : slot);

  return (
    <div className={mealCalendarStyles.monthMealPill(theme)} title={label}>
      {slot}: {label}
      {extraCount > 0 ? ` +${extraCount}` : ""}
    </div>
  );
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default MealCalendar;
