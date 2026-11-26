import { useEffect, useMemo, useState } from "react";
import LoadErrorPanel from "../components/LoadErrorPanel";
import MealCalendar from "../components/MealCalendar";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { MoveMealDialog, RangeActionDialog } from "./planner/PlannerDialogs";
import GroceryExportDialog from "../components/GroceryExportDialog";
import PlannerControls from "../components/PlannerControls";
import PlannerRecipePickerModal from "../components/PlannerRecipePickerModal";
import PrepHelperDialog from "../components/PrepHelperDialog";
import BrowserDetailModal from "../components/recipeBrowser/BrowserDetailModal";
import { useIngredientTagCategories, useIngredients, useLanguage, useMealPlan, useRecipes } from "../contexts";
import type { IGroceryList } from "../interfaces/IGroceryList";
import type { IMealPlanEntry, MealSlot, PlannerViewMode } from "../interfaces/IMeal";
import { groceryListService } from "../services";
import { pageStyles, plannerControlsStyles } from "../styles/appStyles";
import {
  getLocalNumberPreference,
  getLocalPreference,
  getSessionDatePreference,
  localPreferenceKeys,
  removeRetiredLocalPreferences,
  sessionPreferenceKeys,
  setLocalPreference,
  setSessionPreference,
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
import { generateMealPlanEntriesWithIssues } from "../utils/plannerGenerator";
import { buildPrepHelperItems, getPrepIngredientTagNames } from "../utils/plannerPrepHelper";
import { useRouteDetail } from "../utils/hashRoute";
import { buildSystemTagNameLookup } from "../utils/tagCatalog";
import {
  defaultPeopleEating,
  type SelectedPlannerSlot,
  type PendingMealMove,
  getMealPlanEntryKey,
  getMealEntryLabel,
  createPendingMealMove,
  toMealPlanRequest,
  scaleMealPlanRecipes,
  normalizeMoveValue,
  createEmptyGroceryList,
  normalizePeopleEating,
  getPlannerActionError,
  formatGenerationIssues,
  loadDinnerMinimums,
} from "./planner/plannerMeals";

const visibleMealSlots: MealSlot[] = ["Breakfast", "Lunch", "Dinner"];
const plannerViewModes: PlannerViewMode[] = ["week", "month"];

const PlannerPage = () => {
  const { locale, t } = useLanguage();
  const [viewMode, setViewMode] = useState<PlannerViewMode>(() =>
    getLocalPreference(localPreferenceKeys.plannerViewMode, plannerViewModes, "week"),
  );
  // A fresh visit opens on today; the week last viewed is kept only for this browser session.
  const [weekAnchorDate, setWeekAnchorDate] = useState(() =>
    stripTime(getSessionDatePreference(sessionPreferenceKeys.plannerWeekAnchorDate, new Date())),
  );
  const [monthAnchorDate, setMonthAnchorDate] = useState(() =>
    stripTime(getSessionDatePreference(sessionPreferenceKeys.plannerMonthAnchorDate, new Date())),
  );
  const [selectedSlot, setSelectedSlot] = useState<SelectedPlannerSlot | null>(null);
  // An open recipe has an address (#/planner/recipe/12), so Back closes it and the link can be shared.
  const { detail: routeDetail, openDetail, closeDetail } = useRouteDetail("weekPlanner");
  const activeRecipeId = routeDetail?.kind === "recipe" ? routeDetail.id : null;
  const [draggedSlot, setDraggedSlot] = useState<SelectedPlannerSlot | null>(null);
  const [pendingMealMove, setPendingMealMove] = useState<PendingMealMove | null>(null);
  const [pendingMealDelete, setPendingMealDelete] = useState<SelectedPlannerSlot | null>(null);
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
    mealPlanIsSaving,
    initError,
    applyMealPlanBatch,
    clearMealPlanRange,
    deleteMealPlanEntry,
    loadMealPlan,
    prefetchMealPlan,
    refreshMealPlan,
    saveMealPlanEntry,
  } = useMealPlan();
  const { recipes, recipeIsLoading, initError: recipeLoadError, refreshRecipes } = useRecipes();
  const { ingredients, ingredientIsLoading, initError: ingredientLoadError, refreshIngredients } = useIngredients();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const anchorDate = viewMode === "week" ? weekAnchorDate : monthAnchorDate;
  // Skeletons only while the visible range has nothing to show yet; a save or a refresh keeps the slots on screen.
  const shouldShowMealSlotLoading =
    (mealPlanIsLoading && initError === null) ||
    recipeIsLoading ||
    ingredientIsLoading;
  const isMealPlanBusy = mealPlanIsLoading || mealPlanIsSaving;
  // Until the week, its recipes and its ingredients have loaded, a slot that looks empty may not be.
  const areSlotsDisabled = mealPlanIsLoading || recipeIsLoading || ingredientIsLoading;
  const loadError = initError ?? recipeLoadError ?? ingredientLoadError;
  const retryFailedLoads = () =>
    Promise.all([
      initError !== null ? refreshMealPlan() : undefined,
      recipeLoadError !== null ? refreshRecipes() : undefined,
      ingredientLoadError !== null ? refreshIngredients() : undefined,
    ]);

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
        getPrepIngredientTagNames(buildSystemTagNameLookup(ingredientTagCategories)),
      ),
    [ingredientTagCategories, mealPlanEntries, prepRange.from, prepRange.to, recipesById, t],
  );

  useEffect(() => {
    let isCurrent = true;

    void loadMealPlan(visibleRange.from, visibleRange.to).then(() => {
      if (!isCurrent) {
        return;
      }

      // The previous and next range are usually the next ones opened; have them ready.
      for (const direction of [-1, 1] as const) {
        const neighbour = getVisibleRange(addCalendarRange(anchorDate, viewMode, direction), viewMode);
        void prefetchMealPlan(neighbour.from, neighbour.to);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [anchorDate, viewMode, loadMealPlan, prefetchMealPlan, visibleRange.from, visibleRange.to]);

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.plannerViewMode, viewMode);
  }, [viewMode]);

  useEffect(() => {
    setSessionPreference(sessionPreferenceKeys.plannerWeekAnchorDate, toDateInputValue(weekAnchorDate));
  }, [weekAnchorDate]);

  useEffect(() => {
    setSessionPreference(sessionPreferenceKeys.plannerMonthAnchorDate, toDateInputValue(monthAnchorDate));
  }, [monthAnchorDate]);

  useEffect(() => {
    removeRetiredLocalPreferences();
  }, []);

  const getEntryForSlot = (date: string, slot: MealSlot) =>
    entriesByDateSlot.get(getMealPlanEntryKey(date, slot));

  const handleMealDrop = (targetDate: string, targetSlot: MealSlot) => {
    if (viewMode !== "week" || draggedSlot === null) {
      return;
    }

    if (draggedSlot.date === targetDate && draggedSlot.slot === targetSlot) {
      setDraggedSlot(null);
      return;
    }

    const sourceEntry = getEntryForSlot(draggedSlot.date, draggedSlot.slot);
    if (sourceEntry === undefined || sourceEntry.recipes.length === 0) {
      setDraggedSlot(null);
      return;
    }

    const targetEntry = getEntryForSlot(targetDate, targetSlot);
    setDraggedSlot(null);

    if (targetEntry !== undefined && targetEntry.recipes.length > 0) {
      void swapMealSlots(sourceEntry, targetEntry);
      return;
    }

    setPendingMealMove(createPendingMealMove({
      source: draggedSlot,
      sourceEntry,
      target: { date: targetDate, slot: targetSlot },
      label: getMealEntryLabel(sourceEntry, recipesById, ingredientsById, t),
    }));
  };

  const swapMealSlots = async (sourceEntry: IMealPlanEntry, targetEntry: IMealPlanEntry) => {
    setPlannerActionError(null);

    try {
      // One atomic request: each slot gets the other's items.
      await applyMealPlanBatch({
        upsert: [
          toMealPlanRequest(targetEntry, sourceEntry.date, sourceEntry.slot),
          toMealPlanRequest(sourceEntry, targetEntry.date, targetEntry.slot),
        ],
      });
    } catch (error) {
      setPlannerActionError(getPlannerActionError(error, t.planner.couldNotMoveMeal));
    }
  };

  const moveMealToEmptySlot = async () => {
    if (pendingMealMove === null) {
      return;
    }

    const selectedValue = normalizeMoveValue(pendingMealMove.value, pendingMealMove.maxValue);
    const ratio = pendingMealMove.amountKind === "none" ? 1 : selectedValue / pendingMealMove.maxValue;
    const targetRecipes = scaleMealPlanRecipes(pendingMealMove.sourceEntry.recipes, ratio);
    const remainingRecipes = scaleMealPlanRecipes(pendingMealMove.sourceEntry.recipes, 1 - ratio);

    setPlannerActionError(null);

    try {
      // One atomic request: the target gets the moved part, the source keeps the rest or is removed.
      await applyMealPlanBatch({
        upsert: [
          {
            date: pendingMealMove.target.date,
            slot: pendingMealMove.target.slot,
            notes: pendingMealMove.sourceEntry.notes,
            recipes: targetRecipes,
          },
          {
            date: pendingMealMove.source.date,
            slot: pendingMealMove.source.slot,
            notes: pendingMealMove.sourceEntry.notes,
            recipes: remainingRecipes,
          },
        ],
      });

      setPendingMealMove(null);
    } catch (error) {
      setPlannerActionError(getPlannerActionError(error, t.planner.couldNotMoveMeal));
    }
  };

  const removeMealSlot = async () => {
    if (pendingMealDelete === null) {
      return;
    }

    const entry = getEntryForSlot(pendingMealDelete.date, pendingMealDelete.slot);
    if (entry === undefined) {
      setPendingMealDelete(null);
      return;
    }

    setPlannerActionError(null);

    try {
      await deleteMealPlanEntry(entry.mealPlanEntryId);
      setPendingMealDelete(null);
    } catch (error) {
      setPlannerActionError(getPlannerActionError(error, t.planner.couldNotRemoveMeal));
    }
  };

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

  const moveToToday = () => {
    setPlannerActionError(null);
    const today = stripTime(new Date());
    if (viewMode === "week") {
      setWeekAnchorDate(today);
      return;
    }

    setMonthAnchorDate(today);
  };

  const changeViewMode = (nextViewMode: PlannerViewMode) => {
    setPlannerActionError(null);
    setViewMode(nextViewMode);
  };

  const requestClearCurrentRange = () => {
    if (plannerAction !== null || isMealPlanBusy) {
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
    if (plannerAction !== null || isMealPlanBusy) {
      return;
    }

    setPendingPlannerAction("generate");
  };

  const openGroceryExportDialog = async () => {
    if (plannerAction !== null || isMealPlanBusy || isGroceryListLoading) {
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
    // Busy from the start: reading the minimums is a request, and the dialog closes now so it cannot be confirmed twice.
    setPlannerAction("generate");
    setPendingPlannerAction(null);
    const dinnerMinimums = await loadDinnerMinimums();

    const generationResult = generateMealPlanEntriesWithIssues({
      dates: generationDates,
      existingEntries: mealPlanEntries,
      ingredients,
      peopleEating: generatePeopleEating,
      recipes,
      tagCategories: ingredientTagCategories,
      dinnerMinimums,
    });
    const entriesToGenerate = generationResult.entries;
    const generationIssueMessage = formatGenerationIssues(generationResult.issues, t);

    if (entriesToGenerate.length === 0) {
      setPlannerAction(null);
      setPlannerActionError(generationIssueMessage ?? t.planner.noMainDishRecipesFound);
      return;
    }

    setPlannerActionError(null);
    setLocalPreference(localPreferenceKeys.plannerPeopleEating, generatePeopleEating.toString());

    try {
      // The whole range in one atomic request, so a failure cannot leave half a week.
      await applyMealPlanBatch({ upsert: entriesToGenerate });
      setPlannerActionError(generationIssueMessage);
    } catch (error) {
      setPlannerActionError(getPlannerActionError(error, t.planner.couldNotGenerate(rangeLabel)));
    } finally {
      setPlannerAction(null);
    }
  };

  return (
    <main className={pageStyles.plannerShell}>
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
          anchorYear={getAnchorYear(anchorDate, viewMode, locale)}
          isClearRangeRunning={plannerAction === "clear"}
          isExportRangeRunning={isGroceryListLoading}
          isGenerateRangeRunning={plannerAction === "generate"}
          isMobileToolsHidden={selectedSlot !== null}
          isRangeBusy={isMealPlanBusy}
          isShowingToday={visibleRange.from === getVisibleRange(new Date(), viewMode).from}
          viewMode={viewMode}
          onClearRange={requestClearCurrentRange}
          onExportRange={openGroceryExportDialog}
          onGenerateRange={requestGenerateCurrentRange}
          onNextRange={moveToNextRange}
          onOpenPrepHelper={() => setIsPrepHelperOpen(true)}
          onPreviousRange={moveToPreviousRange}
          onToday={moveToToday}
          onViewModeChange={changeViewMode}
        />
        {plannerActionError !== null && (
          <p className={plannerControlsStyles.statusError}>{plannerActionError}</p>
        )}
        {loadError !== null && (
          <LoadErrorPanel
            message={loadError}
            title={t.planner.couldNotLoadMealPlan}
            onRetry={retryFailedLoads}
          />
        )}
        <MealCalendar
          anchorDate={anchorDate}
          dates={visibleDates}
          getEntryForSlot={getEntryForSlot}
          isDisabled={areSlotsDisabled}
          isLoading={shouldShowMealSlotLoading}
          ingredientsById={ingredientsById}
          mealSlots={visibleMealSlots}
          onDeleteSlot={(date, slot) => setPendingMealDelete({ date, slot })}
          onDragEnd={() => setDraggedSlot(null)}
          onDragStart={(date, slot) => setDraggedSlot({ date, slot })}
          onDropOnSlot={handleMealDrop}
          onOpenRecipe={(recipe) => openDetail({ kind: "recipe", id: recipe.recipeId })}
          onSlotClick={(date, slot) => setSelectedSlot({ date, slot })}
          recipesById={recipesById}
          viewMode={viewMode}
        />
      </div>
      {selectedSlot !== null && (
        <PlannerRecipePickerModal
          date={selectedSlot.date}
          entry={getEntryForSlot(selectedSlot.date, selectedSlot.slot)}
          recipes={recipes}
          slot={selectedSlot.slot}
          onClose={() => setSelectedSlot(null)}
          onSave={saveMealPlanEntry}
        />
      )}
      {groceryListPreview !== null && (
        <GroceryExportDialog
          groceryList={groceryListPreview}
          isLoading={isGroceryListLoading}
          loadError={groceryListLoadError}
          onClose={closeGroceryExportDialog}
        />
      )}
      {isPrepHelperOpen && (
        <PrepHelperDialog
          from={prepRange.from}
          items={prepHelperItems}
          to={prepRange.to}
          onClose={() => setIsPrepHelperOpen(false)}
        />
      )}
      {activeRecipeId !== null && (
        <BrowserDetailModal
          detail={{ kind: "recipe", id: activeRecipeId }}
          key={activeRecipeId}
          onClose={closeDetail}
        />
      )}
      {pendingPlannerAction !== null && (
        <RangeActionDialog
          action={pendingPlannerAction}
          isBusy={plannerAction !== null}
          peopleEating={generatePeopleEating}
          rangeName={t.planner.rangeNames[viewMode]}
          onCancel={() => setPendingPlannerAction(null)}
          onConfirm={() => {
            if (pendingPlannerAction === "clear") {
              void clearCurrentRange();
              return;
            }

            void generateCurrentRange();
          }}
          onPeopleEatingChange={setGeneratePeopleEating}
        />
      )}
      {pendingMealMove !== null && (
        <MoveMealDialog
          isBusy={mealPlanIsSaving}
          move={pendingMealMove}
          onCancel={() => setPendingMealMove(null)}
          onConfirm={() => void moveMealToEmptySlot()}
          onValueChange={(value) =>
            setPendingMealMove((currentMove) => (currentMove === null ? null : { ...currentMove, value }))
          }
        />
      )}
      {pendingMealDelete !== null && (
        <ConfirmationDialog
          body={t.planner.removeMealBody}
          confirmLabel={t.common.remove}
          isBusy={mealPlanIsSaving}
          title={t.planner.removeMealTitle}
          tone="danger"
          onCancel={() => setPendingMealDelete(null)}
          onConfirm={() => void removeMealSlot()}
        />
      )}
    </main>
  );
};

export default PlannerPage;
