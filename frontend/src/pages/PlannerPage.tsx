import { useEffect, useMemo, useState } from "react";
import MealCalendar from "../components/MealCalendar";
import ConfirmationDialog from "../components/ConfirmationDialog";
import GroceryExportDialog from "../components/GroceryExportDialog";
import PlannerControls from "../components/PlannerControls";
import PlannerRecipePickerModal from "../components/PlannerRecipePickerModal";
import PrepHelperDialog from "../components/PrepHelperDialog";
import { useLanguage, useMealPlan, useRecipes } from "../contexts";
import type { IGroceryList } from "../interfaces/IGroceryList";
import type { MealRecipeRole, MealSlot, PlannerViewMode } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import { groceryListService } from "../services";
import { pageStyles, plannerControlsStyles, type SiteTheme } from "../styles/appStyles";
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
import { buildPrepHelperItems } from "../utils/plannerPrepHelper";

type PlannerPageProps = {
  theme: SiteTheme;
};

const visibleMealSlots: MealSlot[] = ["Breakfast", "Lunch", "Dinner"];

type SelectedPlannerSlot = {
  date: string;
  slot: MealSlot;
};

const PlannerPage = ({ theme }: PlannerPageProps) => {
  const { locale, t } = useLanguage();
  const [viewMode, setViewMode] = useState<PlannerViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => stripTime(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<SelectedPlannerSlot | null>(null);
  const [plannerAction, setPlannerAction] = useState<"clear" | "generate" | null>(null);
  const [pendingPlannerAction, setPendingPlannerAction] = useState<"clear" | "generate" | null>(null);
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
    deleteMealPlanEntry,
    loadMealPlan,
    saveMealPlanEntry,
  } = useMealPlan();
  const { recipes } = useRecipes();

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

  const getEntryForSlot = (date: string, slot: MealSlot) =>
    entriesByDateSlot.get(getMealPlanEntryKey(date, slot));

  const moveToPreviousRange = () => {
    setPlannerActionError(null);
    setAnchorDate((currentDate) => addCalendarRange(currentDate, viewMode, -1));
  };

  const moveToNextRange = () => {
    setPlannerActionError(null);
    setAnchorDate((currentDate) => addCalendarRange(currentDate, viewMode, 1));
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

    const mainRecipes = recipes.filter((recipe) => recipe.recipeType === "Dish");
    const sideRecipes = recipes.filter(isGeneratedSideRecipe);

    if (mainRecipes.length === 0) {
      setPendingPlannerAction(null);
      setPlannerActionError(t.planner.noMainDishRecipesFound);
      return;
    }

    setPlannerAction("generate");
    setPendingPlannerAction(null);
    setPlannerActionError(null);

    try {
      for (const date of generationDates) {
        const dateKey = toDateInputValue(date);

        for (const slot of visibleMealSlots) {
          if (getEntryForSlot(dateKey, slot) !== undefined) {
            continue;
          }

          const mainRecipe = pickRandomItem(mainRecipes);
          const sideRecipe = sideRecipes.length > 0 ? pickRandomItem(sideRecipes) : null;

          await saveMealPlanEntry(null, {
            date: dateKey,
            slot,
            notes: null,
            recipes: [
              {
                recipeId: mainRecipe.recipeId,
                role: "Main",
                sortOrder: 0,
              },
              ...(sideRecipe === null
                ? []
                : [
                    {
                      recipeId: sideRecipe.recipeId,
                      role: getGeneratedSideRole(sideRecipe),
                      sortOrder: 1,
                    },
                  ]),
            ],
          });
        }
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
      <PlannerControls
        anchorLabel={getAnchorLabel(anchorDate, viewMode, locale, t.planner.weekLabel)}
        anchorYear={getAnchorYear(anchorDate, locale)}
        isClearRangeRunning={plannerAction === "clear"}
        isExportRangeRunning={isGroceryListLoading}
        isGenerateRangeRunning={plannerAction === "generate"}
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
        loadError={initError === null ? null : t.planner.couldNotLoadMealPlan}
        mealSlots={visibleMealSlots}
        onSlotClick={(date, slot) => setSelectedSlot({ date, slot })}
        recipesById={recipesById}
        theme={theme}
        viewMode={viewMode}
      />
      {selectedSlot !== null && (
        <PlannerRecipePickerModal
          date={selectedSlot.date}
          entry={getEntryForSlot(selectedSlot.date, selectedSlot.slot)}
          recipes={recipes}
          slot={selectedSlot.slot}
          theme={theme}
          onClose={() => setSelectedSlot(null)}
          onDelete={deleteMealPlanEntry}
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
              : t.planner.generateRangeBody(t.planner.rangeNames[viewMode])
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

function isGeneratedSideRecipe(recipe: IRecipe) {
  return recipe.recipeType === "Side" || recipe.recipeType === "Sauce" || recipe.recipeType === "Dip";
}

function getGeneratedSideRole(recipe: IRecipe): MealRecipeRole {
  if (recipe.recipeType === "Sauce" || recipe.recipeType === "Dip") {
    return "Sauce";
  }

  return "Side";
}

function pickRandomItem<TItem>(items: TItem[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getPlannerActionError(_error: unknown, fallbackMessage: string) {
  return fallbackMessage;
}

export default PlannerPage;
