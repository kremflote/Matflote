import { useLanguage } from "../contexts";
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
  const { locale, t } = useLanguage();
  const weekDayLabels = t.calendar.weekdaysShort;

  if (viewMode === "month") {
    return (
      <section className={mealCalendarStyles.shell} aria-busy={isLoading} aria-label={t.planner.mealCalendar}>
        <div className={mealCalendarStyles.monthGrid}>
          {weekDayLabels.map((day) => (
            <div className={mealCalendarStyles.monthHeaderCell(theme)} key={day}>
              {day}
            </div>
          ))}
        </div>
        <div className={mealCalendarStyles.monthGridWithOffset}>
          {dates.map((date) => {
            const dateKey = toDateInputValue(date);
            const muted = date.getMonth() !== anchorDate.getMonth();
            return (
              <div
                className={mealCalendarStyles.monthDayCell(theme, muted)}
                key={dateKey}
              >
                <div className={mealCalendarStyles.monthDayNumber(theme, muted)}>{date.getDate()}</div>
                <div className={mealCalendarStyles.monthDayMeals}>
                  {mealSlots.map((slot) => (
                    <MonthMealSummary
                      entry={getEntryForSlot(dateKey, slot)}
                      key={`${dateKey}-${slot}`}
                      onClick={() => onSlotClick(dateKey, slot)}
                      recipesById={recipesById}
                      slot={slot}
                      theme={theme}
                      t={t}
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
    <section className={mealCalendarStyles.shell} aria-busy={isLoading} aria-label={t.planner.mealCalendar}>
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
                <span className={mealCalendarStyles.dayDate(theme)}>{formatDayMonth(date, locale)}</span>
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
  entry?: IMealPlanEntry;
  onClick: () => void;
  recipesById: Map<number, IRecipe>;
  slot: MealSlotId;
  theme: SiteTheme;
  t: ReturnType<typeof useLanguage>["t"];
};

function MonthMealSummary({ entry, onClick, recipesById, slot, theme, t }: MonthMealSummaryProps) {
  const plannedRecipes = entry?.recipes ?? [];
  const firstRecipe = plannedRecipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)[0];
  const recipe = firstRecipe ? recipesById.get(firstRecipe.recipeId) : undefined;
  const extraCount = Math.max(plannedRecipes.length - 1, 0);
  const empty = entry === undefined;
  const slotLabel = t.enums.mealSlots[slot];
  const label = recipe?.name ?? (firstRecipe ? t.planner.recipeFallback(firstRecipe.recipeId) : t.planner.addMealLower(slotLabel));
  const title = entry === undefined ? t.planner.addMeal(slotLabel) : t.planner.editMeal(slotLabel, label);
  const buttonLabel = empty ? t.planner.addMealLower(slotLabel) : label;

  return (
    <button
      aria-label={title}
      className={mealCalendarStyles.monthMealPill(theme, empty)}
      title={title}
      type="button"
      onClick={onClick}
    >
      {buttonLabel}
      {extraCount > 0 ? ` +${extraCount}` : ""}
    </button>
  );
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayMonth(date: Date, locale: string) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);

  return `${day}. ${month}`;
}

export default MealCalendar;
