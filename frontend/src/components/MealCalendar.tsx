import { useEffect, useState } from "react";
import { useLanguage } from "../contexts";
import type { IIngredient } from "../interfaces/IIngredient";
import { mealCalendarStyles } from "../styles/appStyles";
import type { IMealPlanEntry, MealSlot as MealSlotId, PlannerViewMode } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import { getThumbnailSrc } from "../utils/imageThumbnail";
import {
  getLocalStringListPreference,
  localPreferenceKeys,
  setLocalStringListPreference,
} from "../utils/localPreferences";
import MealSlot from "./MealSlot";
import RecipeFallbackTile from "./RecipeFallbackTile";
import { getRecipeTile } from "../utils/recipeTile";
import { belowDesktopMediaQuery, desktopMediaQuery } from "../styles/breakpoints";

type MealCalendarProps = {
  anchorDate: Date;
  dates: Date[];
  getEntryForSlot: (date: string, slot: MealSlotId) => IMealPlanEntry | undefined;
  /** The plan is not known (still loading, or the load failed); slots cannot be opened. */
  isDisabled: boolean;
  isLoading: boolean;
  ingredientsById: Map<number, IIngredient>;
  mealSlots: MealSlotId[];
  onDeleteSlot: (date: string, slot: MealSlotId) => void;
  onDragEnd: () => void;
  onDragStart: (date: string, slot: MealSlotId) => void;
  onDropOnSlot: (date: string, slot: MealSlotId) => void;
  onOpenRecipe: (recipe: IRecipe) => void;
  onSlotClick: (date: string, slot: MealSlotId) => void;
  recipesById: Map<number, IRecipe>;
  viewMode: PlannerViewMode;
};

function MealCalendar({
  anchorDate,
  dates,
  getEntryForSlot,
  isDisabled,
  isLoading,
  ingredientsById,
  mealSlots,
  onDeleteSlot,
  onDragEnd,
  onDragStart,
  onDropOnSlot,
  onOpenRecipe,
  onSlotClick,
  recipesById,
  viewMode,
}: MealCalendarProps) {
  const { locale, t } = useLanguage();
  const [collapsedDateKeys, setCollapsedDateKeys] = useState<Set<string>>(
    () => new Set(getLocalStringListPreference(localPreferenceKeys.plannerCollapsedDateKeys)),
  );
  const [canCollapseDays, setCanCollapseDays] = useState(false);
  const [revealedMonthDateKey, setRevealedMonthDateKey] = useState<string | null>(null);
  const [canUseDesktopInteractions, setCanUseDesktopInteractions] = useState(false);
  const weekDayLabels = t.calendar.weekdaysShort;

  useEffect(() => {
    const mediaQuery = window.matchMedia(belowDesktopMediaQuery);
    const updateCanCollapseDays = () => setCanCollapseDays(mediaQuery.matches);

    updateCanCollapseDays();
    mediaQuery.addEventListener("change", updateCanCollapseDays);

    return () => mediaQuery.removeEventListener("change", updateCanCollapseDays);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(hover: hover) and (pointer: fine) and ${desktopMediaQuery}`);
    const updateCanUseDesktopInteractions = () => setCanUseDesktopInteractions(mediaQuery.matches);

    updateCanUseDesktopInteractions();
    mediaQuery.addEventListener("change", updateCanUseDesktopInteractions);

    return () => mediaQuery.removeEventListener("change", updateCanUseDesktopInteractions);
  }, []);

  useEffect(() => {
    setLocalStringListPreference(localPreferenceKeys.plannerCollapsedDateKeys, collapsedDateKeys);
  }, [collapsedDateKeys]);

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
    const todayKeyForMonth = toDateInputValue(new Date());

    return (
      <section className={mealCalendarStyles.shell} aria-busy={isLoading} aria-label={t.planner.mealCalendar}>
        <div className={mealCalendarStyles.monthHeaderGrid} aria-hidden="true">
          {weekDayLabels.map((day) => (
            <div className={mealCalendarStyles.monthHeaderCell} key={day}>
              {day}
            </div>
          ))}
        </div>
        <div className={mealCalendarStyles.monthGrid}>
          {dates.map((date) => {
            const dateKey = toDateInputValue(date);
            const muted = date.getMonth() !== anchorDate.getMonth();
            const isToday = dateKey === todayKeyForMonth;
            const isRevealed = revealedMonthDateKey === dateKey;
            const dayName = weekDayLabels[(date.getDay() + 6) % 7] ?? "";
            const longDate = formatLongDate(date, locale);

            return (
              <div
                aria-current={isToday ? "date" : undefined}
                className={mealCalendarStyles.monthDayCell(muted, isToday)}
                key={dateKey}
              >
                {/* On touch screens a tap on the date shows the day's add buttons; a mouse reveals them on hover. */}
                <button
                  aria-expanded={isRevealed}
                  aria-label={t.planner.showAddMeals(formatLongDate(date, locale))}
                  className={mealCalendarStyles.monthDayNumberButton(muted, isToday)}
                  disabled={isDisabled}
                  type="button"
                  onClick={() => setRevealedMonthDateKey(isRevealed ? null : dateKey)}
                >
                  <span className={mealCalendarStyles.monthDayName}>{dayName}</span>
                  <span className={mealCalendarStyles.monthDayNumber(isToday)}>{date.getDate()}</span>
                </button>
                <div className={mealCalendarStyles.monthDayMeals}>
                  {mealSlots.map((slot) => (
                    <MonthMealSummary
                      dateLabel={longDate}
                      entry={getEntryForSlot(dateKey, slot)}
                      isDisabled={isDisabled}
                      isRevealed={isRevealed}
                      ingredientsById={ingredientsById}
                      key={`${dateKey}-${slot}`}
                      onClick={() => onSlotClick(dateKey, slot)}
                      recipesById={recipesById}
                      slot={slot}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const todayKey = toDateInputValue(new Date());

  return (
    <section className={mealCalendarStyles.shell} aria-busy={isLoading} aria-label={t.planner.mealCalendar}>
      <div className={mealCalendarStyles.headerRow} aria-hidden="true">
        {mealSlots.map((meal) => (
          <div className={mealCalendarStyles.headerLabel} key={meal}>
            {t.enums.mealSlots[meal]}
          </div>
        ))}
      </div>

      <div className={mealCalendarStyles.rows}>
        {dates.map((date, index) => {
          const dateKey = toDateInputValue(date);
          const isToday = dateKey === todayKey;
          const isCollapsed = canCollapseDays && collapsedDateKeys.has(dateKey);
          const dayLabel = weekDayLabels[index] ?? "";
          const dayDate = formatDayMonth(date, locale);
          const plannedEntries = mealSlots
            .map((meal) => getEntryForSlot(dateKey, meal))
            .filter((entry): entry is IMealPlanEntry => entry !== undefined && entry.recipes.length > 0);

          return (
            <div aria-current={isToday ? "date" : undefined} className={mealCalendarStyles.row} key={dateKey}>
              {canCollapseDays ? (
                <button
                  aria-expanded={!isCollapsed}
                  aria-label={
                    isCollapsed
                      ? t.planner.expandDay(dayLabel, dayDate)
                      : t.planner.collapseDay(dayLabel, dayDate)
                  }
                  className={mealCalendarStyles.dayCellButton(isToday)}
                  type="button"
                  onClick={() => toggleDay(dateKey)}
                >
                  <span className={mealCalendarStyles.dayHeaderTextGroup}>
                    <span className={mealCalendarStyles.dayTitleGroup}>
                      <span className={mealCalendarStyles.dayToggleIcon(isCollapsed)} aria-hidden="true">
                        <ChevronIcon />
                      </span>
                      <span className={mealCalendarStyles.dayLabel(isToday)}>{dayLabel}</span>
                    </span>
                    <span className={mealCalendarStyles.dayDate(isToday)}>{dayDate}</span>
                    {isToday && <span className={mealCalendarStyles.todayBadge}>{t.planner.today}</span>}
                  </span>
                  {/* A folded day shows what is planned in it; an open day shows the cards themselves. */}
                  {isCollapsed && (
                    <span className={mealCalendarStyles.dayPreviewStrip} aria-hidden="true">
                      <span className={mealCalendarStyles.dayPreviewSummary(isToday)}>
                        {t.planner.plannedMealsCount(plannedEntries.length, mealSlots.length)}
                      </span>
                      {plannedEntries.map((entry) => (
                        <DayMealPreview
                          entry={entry}
                          ingredientsById={ingredientsById}
                          key={`${dateKey}-${entry.slot}-preview`}
                          recipesById={recipesById}
                        />
                      ))}
                    </span>
                  )}
                </button>
              ) : (
                <div className={mealCalendarStyles.dayCell(isToday)}>
                  <span className={mealCalendarStyles.dayLabel(isToday)}>{dayLabel}</span>
                  <span className={mealCalendarStyles.dayDate(isToday)}>{dayDate}</span>
                  {isToday && <span className={mealCalendarStyles.todayBadge}>{t.planner.today}</span>}
                </div>
              )}
              <div className={mealCalendarStyles.dayMealGrid(isCollapsed)}>
                {mealSlots.map((meal) => (
                  <MealSlot
                    canUseDesktopInteractions={canUseDesktopInteractions}
                    date={dateKey}
                    dateLabel={formatLongDate(date, locale)}
                    entry={getEntryForSlot(dateKey, meal)}
                    ingredientsById={ingredientsById}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    isToday={isToday}
                    key={`${dateKey}-${meal}`}
                    onDeleteRequest={onDeleteSlot}
                    onDragEnd={onDragEnd}
                    onDragStart={onDragStart}
                    onDropOnSlot={onDropOnSlot}
                    onOpenRecipe={onOpenRecipe}
                    onClick={() => onSlotClick(dateKey, meal)}
                    recipesById={recipesById}
                    slot={meal}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
  ingredientsById: Map<number, IIngredient>;
  recipesById: Map<number, IRecipe>;
};

function DayMealPreview({ entry, ingredientsById, recipesById }: DayMealPreviewProps) {
  const plannedRecipes = entry?.recipes.slice().sort((first, second) => first.sortOrder - second.sortOrder) ?? [];
  const mainRecipe =
    plannedRecipes.find((plannedRecipe) => plannedRecipe.role === "Main") ?? plannedRecipes[0];
  const recipe = mainRecipe?.recipeId === null || mainRecipe === undefined ? undefined : recipesById.get(mainRecipe.recipeId);
  const ingredient = mainRecipe?.ingredientId === null || mainRecipe === undefined ? undefined : ingredientsById.get(mainRecipe.ingredientId);
  const imageUrl = getThumbnailSrc(recipe ?? ingredient);

  if (recipe === undefined && ingredient === undefined) {
    return null;
  }

  return (
    <span className={mealCalendarStyles.dayPreviewFilled}>
      {imageUrl ? (
        <img
          alt=""
          className={mealCalendarStyles.dayPreviewImage}
          src={imageUrl}
          loading="lazy"
          decoding="async"
        />
      ) : recipe !== undefined ? (
        <RecipeFallbackTile recipe={recipe} />
      ) : (
        <span
          className={mealCalendarStyles.dayPreviewImageFallback}
          style={{ backgroundColor: ingredient?.color ?? undefined }}
        />
      )}
    </span>
  );
}

type MonthMealSummaryProps = {
  dateLabel: string;
  entry?: IMealPlanEntry;
  ingredientsById: Map<number, IIngredient>;
  isDisabled: boolean;
  /** The day's add buttons were asked for with a tap. */
  isRevealed: boolean;
  onClick: () => void;
  recipesById: Map<number, IRecipe>;
  slot: MealSlotId;
  t: ReturnType<typeof useLanguage>["t"];
};

function MonthMealSummary({ dateLabel, entry, ingredientsById, isDisabled, isRevealed, onClick, recipesById, slot, t }: MonthMealSummaryProps) {
  const plannedRecipes = entry?.recipes ?? [];
  const sortedPlannedRecipes = plannedRecipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder);
  const mainRecipe =
    sortedPlannedRecipes.find((plannedRecipe) => plannedRecipe.role === "Main") ?? sortedPlannedRecipes[0];
  const recipe = mainRecipe?.recipeId === null || mainRecipe === undefined ? undefined : recipesById.get(mainRecipe.recipeId);
  const ingredient = mainRecipe?.ingredientId === null || mainRecipe === undefined ? undefined : ingredientsById.get(mainRecipe.ingredientId);
  const extraCount = Math.max(plannedRecipes.length - 1, 0);
  const slotLabel = t.enums.mealSlots[slot];

  if (mainRecipe === undefined) {
    return (
      <button
        aria-label={t.planner.mealSlotLabel(dateLabel, slotLabel, null)}
        className={mealCalendarStyles.monthAddButton(isRevealed)}
        disabled={isDisabled}
        title={t.planner.addMeal(slotLabel)}
        type="button"
        onClick={onClick}
      >
        <span aria-hidden="true">+</span> {slotLabel}
      </button>
    );
  }

  const label = recipe?.name ?? ingredient?.ingredientName ?? t.planner.recipeFallback(mainRecipe.recipeId ?? mainRecipe.ingredientId ?? 0);
  const title = t.planner.editMeal(slotLabel, label);
  const accessibleName = t.planner.mealSlotLabel(dateLabel, slotLabel, `${label}${extraCount > 0 ? ` +${extraCount}` : ""}`);
  const color = recipe !== undefined ? getRecipeTile(recipe).colors[0] : (ingredient?.color ?? undefined);

  return (
    <button
      aria-label={accessibleName}
      className={mealCalendarStyles.monthMealChip}
      disabled={isDisabled}
      title={title}
      type="button"
      onClick={onClick}
    >
      <span aria-hidden="true" className={mealCalendarStyles.monthMealChipDot} style={{ backgroundColor: color }} />
      <span className={mealCalendarStyles.monthMealChipText}>
        {label}
        {extraCount > 0 ? ` +${extraCount}` : ""}
      </span>
    </button>
  );
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(date);
}

function formatDayMonth(date: Date, locale: string) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);

  return `${day}. ${month}`;
}

export default MealCalendar;
