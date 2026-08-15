import { useEffect, useMemo, useState } from "react";
import MealCalendar from "../components/MealCalendar";
import ConfirmationDialog from "../components/ConfirmationDialog";
import GroceryExportDialog from "../components/GroceryExportDialog";
import PlannerControls from "../components/PlannerControls";
import PlannerRecipePickerModal from "../components/PlannerRecipePickerModal";
import PrepHelperDialog from "../components/PrepHelperDialog";
import { useIngredientTagCategories, useIngredients, useLanguage, useMealPlan, useRecipes } from "../contexts";
import type { IGroceryList } from "../interfaces/IGroceryList";
import type { MeasurementUnit } from "../interfaces/IIngredient";
import type { IMealPlanEntry, IMealPlanRecipe, MealSlot, PlannerViewMode } from "../interfaces/IMeal";
import { groceryListService } from "../services";
import type { MealPlanEntryRequest, MealPlanRecipeRequest } from "../services/mealPlanService";
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
import {
  generateMealPlanEntriesWithIssues,
  type MealPlanGenerationIssue,
} from "../utils/plannerGenerator";
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

type PendingMealMove = {
  amountKind: "amount" | "none" | "portions";
  label: string;
  maxValue: number;
  source: SelectedPlannerSlot;
  sourceEntry: IMealPlanEntry;
  target: SelectedPlannerSlot;
  unit: MeasurementUnit | null;
  value: number;
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
    initError,
    loadedRange,
    clearMealPlanRange,
    deleteMealPlanEntry,
    loadMealPlan,
    saveMealPlanEntry,
  } = useMealPlan();
  const { recipes } = useRecipes();
  const { ingredients } = useIngredients();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const anchorDate = viewMode === "week" ? weekAnchorDate : monthAnchorDate;
  const shouldShowMealSlotLoading = mealPlanIsLoading || (loadedRange === null && initError === null);

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
      await saveMealPlanEntry(sourceEntry.mealPlanEntryId, toMealPlanRequest(targetEntry, sourceEntry.date, sourceEntry.slot));
      await saveMealPlanEntry(targetEntry.mealPlanEntryId, toMealPlanRequest(sourceEntry, targetEntry.date, targetEntry.slot));
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
      await saveMealPlanEntry(null, {
        date: pendingMealMove.target.date,
        slot: pendingMealMove.target.slot,
        notes: pendingMealMove.sourceEntry.notes,
        recipes: targetRecipes,
      });

      if (remainingRecipes.length === 0) {
        await deleteMealPlanEntry(pendingMealMove.sourceEntry.mealPlanEntryId);
      } else {
        await saveMealPlanEntry(pendingMealMove.sourceEntry.mealPlanEntryId, {
          date: pendingMealMove.source.date,
          slot: pendingMealMove.source.slot,
          notes: pendingMealMove.sourceEntry.notes,
          recipes: remainingRecipes,
        });
      }

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

    const generationResult = generateMealPlanEntriesWithIssues({
      dates: generationDates,
      existingEntries: mealPlanEntries,
      ingredients,
      peopleEating: generatePeopleEating,
      recipes,
      tagCategories: ingredientTagCategories,
    });
    const entriesToGenerate = generationResult.entries;
    const generationIssueMessage = formatGenerationIssues(generationResult.issues, t);

    if (entriesToGenerate.length === 0) {
      setPendingPlannerAction(null);
      setPlannerActionError(generationIssueMessage ?? t.planner.noMainDishRecipesFound);
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
      setPlannerActionError(generationIssueMessage);
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
          isLoading={shouldShowMealSlotLoading}
          ingredientsById={ingredientsById}
          loadError={initError === null ? null : t.planner.couldNotLoadMealPlan}
          mealSlots={visibleMealSlots}
          onDeleteSlot={(date, slot) => setPendingMealDelete({ date, slot })}
          onDragEnd={() => setDraggedSlot(null)}
          onDragStart={(date, slot) => setDraggedSlot({ date, slot })}
          onDropOnSlot={handleMealDrop}
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
      {pendingMealMove !== null && (
        <ConfirmationDialog
          body={
            <>
              <p>{t.planner.moveMealBody(pendingMealMove.label)}</p>
              {pendingMealMove.amountKind !== "none" && (
                <div className={confirmationDialogStyles.settingsGroup}>
                  <label className={confirmationDialogStyles.fieldLabel}>
                    <span className={confirmationDialogStyles.fieldTitle(theme)}>
                      {pendingMealMove.amountKind === "portions"
                        ? t.planner.moveMealPortionsLabel
                        : t.planner.moveMealAmountLabel(pendingMealMove.unit ?? "")}
                    </span>
                    <input
                      className={confirmationDialogStyles.numberInput(theme)}
                      max={pendingMealMove.maxValue}
                      min={1}
                      step={1}
                      type="number"
                      value={pendingMealMove.value}
                      onChange={(event) =>
                        setPendingMealMove((currentMove) =>
                          currentMove === null
                            ? null
                            : {
                                ...currentMove,
                                value: normalizeMoveValue(Number(event.currentTarget.value), currentMove.maxValue),
                              },
                        )
                      }
                    />
                  </label>
                </div>
              )}
            </>
          }
          confirmLabel={t.planner.moveMealConfirm}
          isBusy={mealPlanIsLoading}
          theme={theme}
          title={t.planner.moveMealTitle}
          onCancel={() => setPendingMealMove(null)}
          onConfirm={() => void moveMealToEmptySlot()}
        />
      )}
      {pendingMealDelete !== null && (
        <ConfirmationDialog
          body={t.planner.removeMealBody}
          confirmLabel={t.common.remove}
          isBusy={mealPlanIsLoading}
          theme={theme}
          title={t.planner.removeMealTitle}
          tone="danger"
          onCancel={() => setPendingMealDelete(null)}
          onConfirm={() => void removeMealSlot()}
        />
      )}
    </main>
  );
};

function getMealPlanEntryKey(date: string, slot: MealSlot) {
  return `${date}::${slot}`;
}

function getMainMealItem(entry: IMealPlanEntry) {
  const sortedItems = entry.recipes.slice().sort((first, second) => first.sortOrder - second.sortOrder);

  return sortedItems.find((plannedRecipe) => plannedRecipe.role === "Main") ?? sortedItems[0];
}

function getMealEntryLabel(
  entry: IMealPlanEntry,
  recipesById: ReadonlyMap<number, { name: string }>,
  ingredientsById: ReadonlyMap<number, { ingredientName: string }>,
  t: ReturnType<typeof useLanguage>["t"],
) {
  const mainItem = getMainMealItem(entry);
  const recipe = mainItem?.recipeId === null || mainItem === undefined ? undefined : recipesById.get(mainItem.recipeId);
  const ingredient = mainItem?.ingredientId === null || mainItem === undefined ? undefined : ingredientsById.get(mainItem.ingredientId);

  return recipe?.name ?? ingredient?.ingredientName ?? t.planner.recipeFallback(mainItem?.recipeId ?? mainItem?.ingredientId ?? 0);
}

function createPendingMealMove({
  label,
  source,
  sourceEntry,
  target,
}: {
  label: string;
  source: SelectedPlannerSlot;
  sourceEntry: IMealPlanEntry;
  target: SelectedPlannerSlot;
}): PendingMealMove {
  const mainItem = getMainMealItem(sourceEntry);

  if (mainItem?.recipeId !== null && mainItem?.recipeId !== undefined && mainItem.portions !== null && mainItem.portions > 0) {
    return {
      amountKind: "portions",
      label,
      maxValue: mainItem.portions,
      source,
      sourceEntry,
      target,
      unit: null,
      value: mainItem.portions,
    };
  }

  if (mainItem?.ingredientId !== null && mainItem?.ingredientId !== undefined && mainItem.amount !== null && mainItem.amount > 0) {
    return {
      amountKind: "amount",
      label,
      maxValue: mainItem.amount,
      source,
      sourceEntry,
      target,
      unit: mainItem.unit,
      value: mainItem.amount,
    };
  }

  return {
    amountKind: "none",
    label,
    maxValue: 1,
    source,
    sourceEntry,
    target,
    unit: null,
    value: 1,
  };
}

function toMealPlanRequest(entry: IMealPlanEntry, date: string, slot: MealSlot): MealPlanEntryRequest {
  return {
    date,
    slot,
    notes: entry.notes,
    recipes: toMealPlanRecipeRequests(entry.recipes),
  };
}

function toMealPlanRecipeRequests(recipes: IMealPlanRecipe[]): MealPlanRecipeRequest[] {
  return recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((recipe, index) => ({
      recipeId: recipe.recipeId,
      ingredientId: recipe.ingredientId,
      role: index === 0 ? "Main" : recipe.role,
      sortOrder: index,
      portions: recipe.portions,
      amount: recipe.amount,
      unit: recipe.unit,
    }));
}

function scaleMealPlanRecipes(recipes: IMealPlanRecipe[], ratio: number): MealPlanRecipeRequest[] {
  if (ratio <= 0) {
    return [];
  }

  return recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((recipe, index) => ({
      recipeId: recipe.recipeId,
      ingredientId: recipe.ingredientId,
      role: index === 0 ? "Main" : recipe.role,
      sortOrder: index,
      portions: recipe.portions === null ? null : roundPlannerQuantity(recipe.portions * ratio),
      amount: recipe.amount === null ? null : roundPlannerQuantity(recipe.amount * ratio),
      unit: recipe.unit,
    }))
    .filter((recipe) => recipe.portions === null || recipe.portions > 0)
    .filter((recipe) => recipe.amount === null || recipe.amount > 0);
}

function roundPlannerQuantity(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeMoveValue(value: number, maxValue: number) {
  if (!Number.isFinite(value)) {
    return maxValue;
  }

  return Math.max(1, Math.min(maxValue, Math.round(value)));
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

function formatGenerationIssues(
  issues: MealPlanGenerationIssue[],
  t: ReturnType<typeof useLanguage>["t"],
) {
  if (issues.length === 0) {
    return null;
  }

  return issues
    .map((issue) => {
      switch (issue.code) {
        case "MissingSystemTag":
          return t.planner.generationIssues.missingSystemTag(t.enums.mealSlots[issue.slot]);
        case "NoTaggedRecipes":
          return t.planner.generationIssues.noTaggedRecipes(t.enums.mealSlots[issue.slot], issue.tagName);
        case "NoRecipeWithEnoughPortions":
          return t.planner.generationIssues.noRecipeWithEnoughPortions(
            t.enums.mealSlots[issue.slot],
            issue.tagName,
            issue.peopleEating,
          );
        case "NoAvailableDinnerRecipes":
          return t.planner.generationIssues.noAvailableDinnerRecipes;
        case "NoEmptySlots":
          return t.planner.generationIssues.noEmptySlots;
        case "NoToppingIngredients":
          return t.planner.generationIssues.noToppingIngredients(issue.tagName);
      }
    })
    .join(" ");
}

export default PlannerPage;
