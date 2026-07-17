import { useEffect, useState } from "react";
import { useLanguage } from "../contexts";
import { mealCalendarStyles, type SiteTheme } from "../styles/appStyles";
import type { IMealPlanEntry, MealSlot as MealSlotId, PlannerViewMode } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import { getApiAssetUrl } from "../services/apiClient";
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
  const [collapsedDateKeys, setCollapsedDateKeys] = useState<Set<string>>(() => new Set());
  const [canCollapseDays, setCanCollapseDays] = useState(false);
  const weekDayLabels = t.calendar.weekdaysShort;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1100px)");
    const updateCanCollapseDays = () => setCanCollapseDays(mediaQuery.matches);

    updateCanCollapseDays();
    mediaQuery.addEventListener("change", updateCanCollapseDays);

    return () => mediaQuery.removeEventListener("change", updateCanCollapseDays);
  }, []);

  const toggleDay = (dateKey: string) => {
    setCollapsedDateKeys((currentDateKeys) => {
      const nextDateKeys = new Set(currentDateKeys);

      if (nextDateKeys.has(dateKey)) {
        nextDateKeys.delete(dateKey);
      } else {
        nextDateKeys.add(dateKey);
      }

      return nextDateKeys;
    });
  };

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
          const isCollapsed = canCollapseDays && collapsedDateKeys.has(dateKey);
          const dayLabel = weekDayLabels[index] ?? "";
          const dayDate = formatDayMonth(date, locale);

          return (
            <div className={mealCalendarStyles.row} key={dateKey}>
              {canCollapseDays ? (
                <button
                  aria-expanded={!isCollapsed}
                  aria-label={
                    isCollapsed
                      ? t.planner.expandDay(dayLabel, dayDate)
                      : t.planner.collapseDay(dayLabel, dayDate)
                  }
                  className={mealCalendarStyles.dayCellButton(theme)}
                  type="button"
                  onClick={() => toggleDay(dateKey)}
                >
                  <span className={mealCalendarStyles.dayHeaderTextGroup}>
                    <span className={mealCalendarStyles.dayTitleGroup}>
                      <span className={mealCalendarStyles.dayToggleIcon(isCollapsed)} aria-hidden="true">
                        <ChevronIcon />
                      </span>
                      <span className={mealCalendarStyles.dayLabel}>{dayLabel}</span>
                    </span>
                    <span className={mealCalendarStyles.dayDate(theme)}>{dayDate}</span>
                  </span>
                  <span className={mealCalendarStyles.dayPreviewStrip} aria-hidden="true">
                    {mealSlots.map((meal) => (
                      <DayMealPreview
                        entry={getEntryForSlot(dateKey, meal)}
                        key={`${dateKey}-${meal}-preview`}
                        recipesById={recipesById}
                        theme={theme}
                      />
                    ))}
                  </span>
                </button>
              ) : (
                <div className={mealCalendarStyles.dayCell(theme)}>
                  <span className={mealCalendarStyles.dayTitleGroup}>
                    <span className={mealCalendarStyles.dayLabel}>{dayLabel}</span>
                  </span>
                  <span className={mealCalendarStyles.dayDate(theme)}>{dayDate}</span>
                </div>
              )}
              <div className={mealCalendarStyles.dayMealGrid(isCollapsed)}>
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

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className={mealCalendarStyles.dayToggleSvg} viewBox="0 0 24 24">
      <path d="m8.6 5.8 6.2 6.2-6.2 6.2 1.4 1.4 7.6-7.6L10 4.4 8.6 5.8Z" />
    </svg>
  );
}

type DayMealPreviewProps = {
  entry?: IMealPlanEntry;
  recipesById: Map<number, IRecipe>;
  theme: SiteTheme;
};

function DayMealPreview({ entry, recipesById, theme }: DayMealPreviewProps) {
  const plannedRecipes = entry?.recipes.slice().sort((first, second) => first.sortOrder - second.sortOrder) ?? [];
  const mainRecipe =
    plannedRecipes.find((plannedRecipe) => plannedRecipe.role === "Main") ?? plannedRecipes[0];
  const recipe = mainRecipe ? recipesById.get(mainRecipe.recipeId) : undefined;
  const imageUrl = getApiAssetUrl(recipe?.imageUrl ?? null);

  if (recipe === undefined) {
    return <span className={mealCalendarStyles.dayPreviewEmpty(theme)} />;
  }

  return (
    <span className={mealCalendarStyles.dayPreviewFilled(theme)}>
      {imageUrl ? (
        <img
          alt=""
          className={mealCalendarStyles.dayPreviewImage}
          src={imageUrl}
        />
      ) : (
        <span className={mealCalendarStyles.dayPreviewImageFallback(theme)} />
      )}
    </span>
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
