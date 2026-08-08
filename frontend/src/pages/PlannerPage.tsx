import { useEffect, useMemo, useState } from "react";
import MealCalendar from "../components/MealCalendar";
import ConfirmationDialog from "../components/ConfirmationDialog";
import GroceryExportDialog from "../components/GroceryExportDialog";
import PlannerControls from "../components/PlannerControls";
import PlannerRecipePickerModal from "../components/PlannerRecipePickerModal";
import PrepHelperDialog from "../components/PrepHelperDialog";
import { useIngredientTagCategories, useIngredients, useLanguage, useMealPlan, useRecipes } from "../contexts";
import type { IGroceryList } from "../interfaces/IGroceryList";
import type { MealSlot, PlannerViewMode } from "../interfaces/IMeal";
import { groceryListService } from "../services";
import { pageStyles, plannerControlsStyles, type SiteTheme } from "../styles/appStyles";
import { confirmationDialogStyles } from "../styles/confirmationDialogStyles";
import {
  getLocalDatePreference,
  getLocalNumberPreference,
  getLocalPreference,
  localPreferenceKeys,
  setLocalPreference,
} from "../utils/localPreferences";
import {
  addCalendarRange,
  getAnchorLabel,
  getAnchorYear,
  getClearRange,
  getDatesInRange,
  getGenerationDates,
  getVisibleRange,
  getWeekRange,
  stripTime,
  toDateInputValue,
} from "../utils/plannerDate";
import { generateMealPlanEntries } from "../utils/plannerGenerator";
import { buildPrepHelperItems } from "../utils/plannerPrepHelper";

type PlannerPageProps = {
  theme: SiteTheme;
};

const visibleMealSlots: MealSlot[] = ["Breakfast", "Lunch", "Dinner"];
const plannerViewModes: PlannerViewMode[] = ["week", "month"];
const defaultPeopleEating = 2;

type SelectedPlannerSlot = {
  date: string;
  slot: MealSlot;
};

const PlannerPage = ({ theme }: PlannerPageProps) => {
  const { locale, t } = useLanguage();
  const [viewMode, setViewMode] = useState<PlannerViewMode>(() =>
    getLocalPreference(localPreferenceKeys.plannerViewMode, plannerViewModes, "week"),
  );
  const [weekAnchorDate, setWeekAnchorDate] = useState(() =>
    stripTime(getLocalDatePreference(
      localPreferenceKeys.plannerWeekAnchorDate,
      getLocalDatePreference(localPreferenceKeys.plannerAnchorDate, new Date()),
    )),
  );
  const [monthAnchorDate, setMonthAnchorDate] = useState(() =>
    stripTime(getLocalDatePreference(
      localPreferenceKeys.plannerMonthAnchorDate,
      getLocalDatePreference(localPreferenceKeys.plannerAnchorDate, new Date()),
    )),
  );
  const [selectedSlot, setSelectedSlot] = useState<SelectedPlannerSlot | null>(null);
  const [plannerAction, setPlannerAction] = useState<"clear" | "generate" | null>(null);
  const [pendingPlannerAction, setPendingPlannerAction] = useState<"clear" | "generate" | null>(null);
  const [generatePeopleEating, setGeneratePeopleEating] = useState(() =>
    normalizePeopleEating(getLocalNumberPreference(localPreferenceKeys.plannerPeopleEating, defaultPeopleEating)),
  );
  const [plannerActionError, setPlannerActionError] = useState<string | null>(null);
  const [groceryListPreview, setGroceryListPreview] = useState<IGroceryList | null>(null);
  const [isGroceryListLoading, setIsGroceryListLoading] = useState(false);
  const [groceryListLoadError, setGroceryListLoadError] = useState<string | null>(null);
  const [isPrepHelperOpen, setIsPrepHelperOpen] = useState(false);
  const {
    mealPlanEntries,
    mealPlanIsLoading,
    initError,
    clearMealPlanRange,
    loadMealPlan,
    saveMealPlanEntry,
  } = useMealPlan();
  const { recipes } = useRecipes();
  const { ingredients } = useIngredients();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const anchorDate = viewMode === "week" ? weekAnchorDate : monthAnchorDate;

  const visibleRange = useMemo(
    () => getVisibleRange(anchorDate, viewMode),
    [anchorDate, viewMode],
  );

  const visibleDates = useMemo(
    () => getDatesInRange(visibleRange.fromDate, visibleRange.toDate),
    [visibleRange],
  );

  const recipesById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.recipeId, recipe])),
    [recipes],
  );
  const ingredientsById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.ingredientId, ingredient])),
    [ingredients],
  );

  const entriesByDateSlot = useMemo(
    () =>
      new Map(
        mealPlanEntries.map((entry) => [
          getMealPlanEntryKey(entry.date, entry.slot),
          entry,
        ]),
      ),
    [mealPlanEntries],
  );

  const prepRange = useMemo(() => getWeekRange(anchorDate), [anchorDate]);
  const prepHelperItems = useMemo(
    () =>
      buildPrepHelperItems(
        mealPlanEntries,
        recipesById,
        prepRange.from,
        prepRange.to,
        t.enums.ingredientPreparations,
        t.planner.prepActionLabels,
      ),
    [mealPlanEntries, prepRange.from, prepRange.to, recipesById, t],
  );

  useEffect(() => {
    void loadMealPlan(visibleRange.from, visibleRange.to);
  }, [loadMealPlan, visibleRange.from, visibleRange.to]);

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.plannerViewMode, viewMode);
  }, [viewMode]);

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.plannerWeekAnchorDate, toDateInputValue(weekAnchorDate));
  }, [weekAnchorDate]);

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.plannerMonthAnchorDate, toDateInputValue(monthAnchorDate));
  }, [monthAnchorDate]);

  const getEntryForSlot = (date: string, slot: MealSlot) =>
    entriesByDateSlot.get(getMealPlanEntryKey(date, slot));

  const moveToPreviousRange = () => {
    setPlannerActionError(null);
    if (viewMode === "week") {
      setWeekAnchorDate((currentDate) => addCalendarRange(currentDate, viewMode, -1));
      return;
    }

    setMonthAnchorDate((currentDate) => addCalendarRange(currentDate, viewMode, -1));
  };

  const moveToNextRange = () => {
    setPlannerActionError(null);
    if (viewMode === "week") {
      setWeekAnchorDate((currentDate) => addCalendarRange(currentDate, viewMode, 1));
      return;
    }

    setMonthAnchorDate((currentDate) => addCalendarRange(currentDate, viewMode, 1));
  };

  const changeViewMode = (nextViewMode: PlannerViewMode) => {
    setPlannerActionError(null);
    setViewMode(nextViewMode);
  };

  const requestClearCurrentRange = () => {
    if (plannerAction !== null || mealPlanIsLoading) {
      return;
    }

    setPendingPlannerAction("clear");
  };

  const clearCurrentRange = async () => {
    const clearRange = getClearRange(anchorDate, viewMode);
    const rangeLabel = t.planner.rangeNames[viewMode];

    setPlannerAction("clear");
    setPendingPlannerAction(null);
    setPlannerActionError(null);

    try {
      await clearMealPlanRange(clearRange.from, clearRange.to);
    } catch (error) {
      setPlannerActionError(getPlannerActionError(error, t.planner.couldNotClear(rangeLabel)));
    } finally {
      setPlannerAction(null);
    }
  };

  const requestGenerateCurrentRange = () => {
    if (plannerAction !== null || mealPlanIsLoading) {
      return;
    }

    setPendingPlannerAction("generate");
  };

  const openGroceryExportDialog = async () => {
    if (plannerAction !== null || mealPlanIsLoading || isGroceryListLoading) {
      return;
    }

    setGroceryListPreview(createEmptyGroceryList(visibleRange.from, visibleRange.to));
    setIsGroceryListLoading(true);
    setGroceryListLoadError(null);
    setPlannerActionError(null);

    try {
      setGroceryListPreview(await groceryListService.preview(visibleRange.from, visibleRange.to));
    } catch (_error) {
      setGroceryListLoadError(t.planner.groceryExportCouldNotLoad);
    } finally {
      setIsGroceryListLoading(false);
    }
  };

  const closeGroceryExportDialog = () => {
    setGroceryListPreview(null);
    setGroceryListLoadError(null);
  };

  const generateCurrentRange = async () => {
    const generationDates = getGenerationDates(anchorDate, viewMode);
    const rangeLabel = t.planner.rangeNames[viewMode];

    const entriesToGenerate = generateMealPlanEntries({
      dates: generationDates,
      existingEntries: mealPlanEntries,
      ingredients,
      peopleEating: generatePeopleEating,
      recipes,
      tagCategories: ingredientTagCategories,
    });

    if (entriesToGenerate.length === 0) {
      setPendingPlannerAction(null);
      setPlannerActionError(t.planner.noMainDishRecipesFound);
      return;
    }

    setPlannerAction("generate");
    setPendingPlannerAction(null);
    setPlannerActionError(null);
    setLocalPreference(localPreferenceKeys.plannerPeopleEating, generatePeopleEating.toString());

    try {
      for (const entryToGenerate of entriesToGenerate) {
        await saveMealPlanEntry(null, entryToGenerate);
      }
    } catch (error) {
      setPlannerActionError(getPlannerActionError(error, t.planner.couldNotGenerate(rangeLabel)));
    } finally {
      setPlannerAction(null);
    }
  };

  return (
    <main className={pageStyles.shell}>
      {pageStyles.showColumnDebugOverlay && (
        <div className={pageStyles.columnDebugOverlay} aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <div className={pageStyles.columnDebugCell} key={index} />
          ))}
        </div>
      )}
      <div className={plannerControlsStyles.viewport}>
        <PlannerControls
          anchorLabel={getAnchorLabel(anchorDate, viewMode, locale, t.planner.weekLabel)}
          anchorYear={getAnchorYear(anchorDate, locale)}
          isClearRangeRunning={plannerAction === "clear"}
          isExportRangeRunning={isGroceryListLoading}
          isGenerateRangeRunning={plannerAction === "generate"}
          isMobileToolsHidden={selectedSlot !== null}
          isRangeBusy={mealPlanIsLoading}
          theme={theme}
          viewMode={viewMode}
          onClearRange={requestClearCurrentRange}
          onExportRange={openGroceryExportDialog}
          onGenerateRange={requestGenerateCurrentRange}
          onNextRange={moveToNextRange}
          onOpenPrepHelper={() => setIsPrepHelperOpen(true)}
          onPreviousRange={moveToPreviousRange}
          onViewModeChange={changeViewMode}
        />
        {plannerActionError !== null && (
          <p className={plannerControlsStyles.statusError(theme)}>{plannerActionError}</p>
        )}
        <MealCalendar
          anchorDate={anchorDate}
          dates={visibleDates}
          getEntryForSlot={getEntryForSlot}
          isLoading={mealPlanIsLoading}
          ingredientsById={ingredientsById}
          loadError={initError === null ? null : t.planner.couldNotLoadMealPlan}
          mealSlots={visibleMealSlots}
          onSlotClick={(date, slot) => setSelectedSlot({ date, slot })}
          recipesById={recipesById}
          theme={theme}
          viewMode={viewMode}
        />
      </div>
      {selectedSlot !== null && (
        <PlannerRecipePickerModal
          date={selectedSlot.date}
          entry={getEntryForSlot(selectedSlot.date, selectedSlot.slot)}
          recipes={recipes}
          slot={selectedSlot.slot}
          theme={theme}
          onClose={() => setSelectedSlot(null)}
          onSave={saveMealPlanEntry}
        />
      )}
      {groceryListPreview !== null && (
        <GroceryExportDialog
          groceryList={groceryListPreview}
          isLoading={isGroceryListLoading}
          loadError={groceryListLoadError}
          theme={theme}
          onClose={closeGroceryExportDialog}
        />
      )}
      {isPrepHelperOpen && (
        <PrepHelperDialog
          from={prepRange.from}
          items={prepHelperItems}
          theme={theme}
          to={prepRange.to}
          onClose={() => setIsPrepHelperOpen(false)}
        />
      )}
      {pendingPlannerAction !== null && (
        <ConfirmationDialog
          body={
            pendingPlannerAction === "clear"
              ? t.planner.clearRangeBody(t.planner.rangeNames[viewMode])
              : (
                  <>
                    <p>{t.planner.generateRangeBody(t.planner.rangeNames[viewMode])}</p>
                    <div className={confirmationDialogStyles.settingsGroup}>
                      <label className={confirmationDialogStyles.fieldLabel}>
                        <span className={confirmationDialogStyles.fieldTitle(theme)}>
                          {t.planner.peopleEatingThisWeek}
                        </span>
                        <input
                          className={confirmationDialogStyles.numberInput(theme)}
                          min={1}
                          step={1}
                          type="number"
                          value={generatePeopleEating}
                          onChange={(event) =>
                            setGeneratePeopleEating(normalizePeopleEating(Number(event.currentTarget.value)))
                          }
                        />
                      </label>
                    </div>
                  </>
                )
          }
          confirmLabel={pendingPlannerAction === "clear" ? t.common.clear : t.planner.generateMealPlan}
          isBusy={plannerAction !== null}
          theme={theme}
          title={
            pendingPlannerAction === "clear"
              ? t.planner.clearRange(t.planner.rangeNames[viewMode])
              : t.planner.generateCurrent(t.planner.rangeNames[viewMode])
          }
          tone={pendingPlannerAction === "clear" ? "danger" : "default"}
          onCancel={() => setPendingPlannerAction(null)}
          onConfirm={() => {
            if (pendingPlannerAction === "clear") {
              void clearCurrentRange();
              return;
            }

            void generateCurrentRange();
          }}
        />
      )}
    </main>
  );
};

function getMealPlanEntryKey(date: string, slot: MealSlot) {
  return `${date}::${slot}`;
}

function createEmptyGroceryList(from: string, to: string): IGroceryList {
  return {
    from,
    to,
    generatedAt: new Date().toISOString(),
    sections: [],
  };
}

function normalizePeopleEating(value: number) {
  if (!Number.isFinite(value)) {
    return defaultPeopleEating;
  }

  return Math.max(1, Math.min(24, Math.round(value)));
}

function getPlannerActionError(_error: unknown, fallbackMessage: string) {
  return fallbackMessage;
}

export default PlannerPage;
