import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useCuisines, useIngredients, useLanguage } from "../contexts";
import type { IngredientTag } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealSlot } from "../interfaces/IMeal";
import type { IRecipe, RecipeTag } from "../interfaces/IRecipe";
import type { MealPlanEntryRequest } from "../services/mealPlanService";
import { plannerPickerStyles, type SiteTheme } from "../styles/appStyles";
import { recipeTags } from "./recipeBrowser/formOptions";
import { recipeBrowserStyles } from "./recipeBrowser/recipeBrowserStyles";
import {
  excludedSupplementaryTags,
  getSupplementaryRole,
  isMainDish,
  isSupplementaryRecipe,
  mainProteinFilters,
  matchesSearch,
  matchesSelectedCuisines,
  matchesIngredientSearch,
  matchesSelectedIngredients,
  matchesSelectedIngredientTags,
  matchesSelectedRecipeTags,
  maxSupplementaryRecipes,
  recipeHasIngredientTag,
  supplementaryFilters,
  supplementaryRecipeTagFilters,
  supplementaryRecipeTypeFilters,
  toggleSelection,
} from "./plannerRecipePicker/plannerRecipePickerFilters";
import { FilterGroup, NumberFilterGroup } from "./recipeBrowser/BrowserFilterGroups";
import {
  FilterIcon,
  IngredientFilterChips,
  IngredientPickerPopover,
} from "./plannerRecipePicker/PlannerRecipePickerIngredients";
import PlannerRecipePickerGrid from "./plannerRecipePicker/PlannerRecipePickerGrid";
import PlannerRecipePickerSelection from "./plannerRecipePicker/PlannerRecipePickerSelection";
import type {
  PickerPhase,
  SupplementaryFilter,
} from "./plannerRecipePicker/plannerRecipePickerTypes";
import ConfirmationDialog from "./ConfirmationDialog";
import Modal from "./Modal";

type PlannerRecipePickerModalProps = {
  date: string;
  entry?: IMealPlanEntry;
  recipes: IRecipe[];
  slot: MealSlot;
  theme: SiteTheme;
  onClose: () => void;
  onDelete: (entryId: number) => Promise<void>;
  onSave: (entryId: number | null, request: MealPlanEntryRequest) => Promise<void>;
};

function PlannerRecipePickerModal({
  date,
  entry,
  recipes,
  slot,
  theme,
  onClose,
  onDelete,
  onSave,
}: PlannerRecipePickerModalProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const { cuisines } = useCuisines();
  const { ingredients } = useIngredients();
  const initialMainRecipeId = entry?.recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .find((plannedRecipe) => plannedRecipe.role === "Main")?.recipeId ?? null;
  const initialSupplementaryIds =
    entry?.recipes
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .filter((plannedRecipe) => plannedRecipe.role !== "Main")
      .map((plannedRecipe) => plannedRecipe.recipeId) ?? [];
  const [phase, setPhase] = useState<PickerPhase>("main");
  const [searchTerm, setSearchTerm] = useState("");
  const [mainRecipeId, setMainRecipeId] = useState<number | null>(initialMainRecipeId);
  const [highlightedMainRecipeId, setHighlightedMainRecipeId] = useState<number | null>(initialMainRecipeId);
  const [supplementaryRecipeIds, setSupplementaryRecipeIds] = useState<number[]>(initialSupplementaryIds);
  const [selectedSupplementaryFilters, setSelectedSupplementaryFilters] =
    useState<SupplementaryFilter[]>(supplementaryFilters);
  const [selectedMainProteinTags, setSelectedMainProteinTags] = useState<IngredientTag[]>([]);
  const [selectedMainRecipeTags, setSelectedMainRecipeTags] = useState<RecipeTag[]>([]);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<number[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [ingredientPickerSearch, setIngredientPickerSearch] = useState("");
  const [ingredientPickerPosition, setIngredientPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const modalPanelRef = useRef<HTMLElement | null>(null);
  const ingredientFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const ingredientPickerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const recipeById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.recipeId, recipe])),
    [recipes],
  );

  const visibleRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) =>
          phase === "main"
            ? isMainDish(recipe) &&
              matchesSelectedIngredientTags(recipe, selectedMainProteinTags) &&
              matchesSelectedRecipeTags(recipe, selectedMainRecipeTags)
            : isSupplementaryRecipe(recipe, selectedSupplementaryFilters),
        )
        .filter((recipe) => matchesSelectedCuisines(recipe, selectedCuisineIds))
        .filter((recipe) => matchesSelectedIngredients(recipe, selectedIngredientIds))
        .filter((recipe) => recipe.recipeId !== mainRecipeId || phase === "main")
        .filter((recipe) => matchesSearch(recipe, searchTerm))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [
      mainRecipeId,
      phase,
      recipes,
      searchTerm,
      selectedCuisineIds,
      selectedIngredientIds,
      selectedMainProteinTags,
      selectedMainRecipeTags,
      selectedSupplementaryFilters,
    ],
  );

  const availableMainProteinTags = useMemo(() => {
    const availableTags = new Set<IngredientTag>();

    recipes.filter(isMainDish).forEach((recipe) => {
      mainProteinFilters.forEach((ingredientTag) => {
        if (recipeHasIngredientTag(recipe, ingredientTag)) {
          availableTags.add(ingredientTag);
        }
      });
    });

    return availableTags;
  }, [recipes]);

  const availableMainRecipeTags = useMemo(() => {
    const availableTags = new Set<RecipeTag>();

    recipes.filter(isMainDish).forEach((recipe) => {
      recipe.tags.forEach((recipeTag) => availableTags.add(recipeTag));
    });

    return availableTags;
  }, [recipes]);

  const availableSupplementaryFilters = useMemo(() => {
    const availableFilters = new Set<SupplementaryFilter>();

    recipes.forEach((recipe) => {
      if (excludedSupplementaryTags.some((tag) => recipe.tags.includes(tag))) {
        return;
      }

      if (supplementaryRecipeTypeFilters.includes(recipe.recipeType)) {
        availableFilters.add(recipe.recipeType);
      }

      supplementaryRecipeTagFilters.forEach((recipeTag) => {
        if (recipe.tags.includes(recipeTag)) {
          availableFilters.add(recipeTag);
        }
      });
    });

    return availableFilters;
  }, [recipes]);

  const cuisineOptions = useMemo(() => {
    const availableCuisineIds = new Set(
      recipes
        .filter((recipe) =>
          phase === "main"
            ? isMainDish(recipe)
            : isSupplementaryRecipe(recipe, selectedSupplementaryFilters),
        )
        .map((recipe) => recipe.cuisineId)
        .filter((cuisineId): cuisineId is number => cuisineId !== null),
    );

    return cuisines
      .map((cuisine) => ({
        disabled: !availableCuisineIds.has(cuisine.cuisineId),
        id: cuisine.cuisineId,
        label: cuisine.name,
      }))
      .sort((first, second) => first.label.localeCompare(second.label));
  }, [cuisines, phase, recipes, selectedSupplementaryFilters]);

  const selectedIngredients = useMemo(
    () => ingredients.filter((ingredient) => selectedIngredientIds.includes(ingredient.ingredientId)),
    [ingredients, selectedIngredientIds],
  );

  const ingredientPickerOptions = useMemo(
    () =>
      ingredients
        .filter((ingredient) => matchesIngredientSearch(ingredient, ingredientPickerSearch))
        .sort((first, second) => first.ingredientName.localeCompare(second.ingredientName)),
    [ingredients, ingredientPickerSearch],
  );

  const mainRecipe = mainRecipeId === null ? null : recipeById.get(mainRecipeId) ?? null;
  const supplementaryRecipes = supplementaryRecipeIds
    .map((recipeId) => recipeById.get(recipeId))
    .filter((recipe): recipe is IRecipe => recipe !== undefined);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    searchInputRef.current?.focus();

    return () => {
      previouslyFocusedElement?.focus();
    };
  }, []);

  useEffect(() => {
    if (ingredientPickerPosition === null) {
      return;
    }

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (
        ingredientPickerRef.current?.contains(target) ||
        ingredientFilterButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIngredientPickerPosition(null);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [ingredientPickerPosition]);

  useEffect(() => {
    if (isConfirmingRemove) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isCategoryFilterOpen) {
          setIsCategoryFilterOpen(false);
          return;
        }

        onClose();
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event, modalPanelRef.current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCategoryFilterOpen, isConfirmingRemove, onClose]);

  const highlightMainRecipe = (recipe: IRecipe) => {
    if (mainRecipeId === recipe.recipeId) {
      setHighlightedMainRecipeId(null);
      setMainRecipeId(null);
      setSupplementaryRecipeIds([]);
      return;
    }

    setHighlightedMainRecipeId(recipe.recipeId);
    setMainRecipeId(recipe.recipeId);
    setSupplementaryRecipeIds([]);
  };

  const confirmHighlightedMainRecipe = () => {
    if (mainRecipeId === null) {
      return;
    }

    setHighlightedMainRecipeId(mainRecipeId);
    setPhase("supplements");
    setSearchTerm("");
  };

  const toggleSupplementaryRecipe = (recipe: IRecipe) => {
    setSupplementaryRecipeIds((currentIds) => {
      if (currentIds.includes(recipe.recipeId)) {
        return currentIds.filter((recipeId) => recipeId !== recipe.recipeId);
      }

      if (currentIds.length >= maxSupplementaryRecipes) {
        return currentIds;
      }

      return [...currentIds, recipe.recipeId];
    });
  };

  const removeMealSlot = async () => {
    if (entry === undefined) {
      return;
    }

    setIsRemoving(true);
    setSaveError(null);

    try {
      await onDelete(entry.mealPlanEntryId);
      onClose();
    } catch {
      setSaveError(t.planner.couldNotRemoveMeal);
    } finally {
      setIsRemoving(false);
      setIsConfirmingRemove(false);
    }
  };

  const saveMealSlot = async () => {
    if (mainRecipe === null) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(entry?.mealPlanEntryId ?? null, {
        date,
        slot,
        notes: entry?.notes ?? null,
        recipes: [
          {
            recipeId: mainRecipe.recipeId,
            role: "Main",
            sortOrder: 0,
          },
          ...supplementaryRecipes.map((recipe, index) => ({
            recipeId: recipe.recipeId,
            role: getSupplementaryRole(recipe),
            sortOrder: index + 1,
          })),
        ],
      });
      onClose();
    } catch {
      setSaveError(t.planner.couldNotSaveMeal);
    } finally {
      setIsSaving(false);
    }
  };

  const filterSection = (
    <aside className={plannerPickerStyles.filterRail(theme)} aria-label={t.filters.recipeFilters}>
      {phase === "main" ? (
        <>
          <FilterGroup
            disabledValues={mainProteinFilters.filter(
              (filter) => !availableMainProteinTags.has(filter),
            )}
            selectedValues={selectedMainProteinTags}
            theme={theme}
            title={t.filters.protein}
            values={mainProteinFilters}
            formatValue={(value) => t.enums.ingredientTags[value]}
            onToggle={(value) => toggleSelection(value, setSelectedMainProteinTags)}
          />
          <FilterGroup
            disabledValues={recipeTags.filter(
              (filter) => !availableMainRecipeTags.has(filter),
            )}
            selectedValues={selectedMainRecipeTags}
            theme={theme}
            title={t.filters.tags}
            values={recipeTags}
            formatValue={(value) => t.enums.recipeTags[value]}
            onToggle={(value) => toggleSelection(value, setSelectedMainRecipeTags)}
          />
        </>
      ) : (
        <FilterGroup
          disabledValues={supplementaryFilters.filter(
            (filter) => !availableSupplementaryFilters.has(filter),
          )}
          selectedValues={selectedSupplementaryFilters}
          theme={theme}
          title={t.filters.type}
          values={supplementaryFilters}
          formatValue={(value) =>
            value in t.enums.recipeTypes
              ? t.enums.recipeTypes[value as keyof typeof t.enums.recipeTypes]
              : t.enums.recipeTags[value as keyof typeof t.enums.recipeTags]
          }
          onToggle={(value) => toggleSelection(value, setSelectedSupplementaryFilters)}
        />
      )}
      {cuisines.length > 0 && (
        <NumberFilterGroup
          selectedValues={selectedCuisineIds}
          theme={theme}
          title={t.filters.cuisine}
          values={cuisineOptions}
          onToggle={(value) => toggleSelection(value, setSelectedCuisineIds)}
        />
      )}
    </aside>
  );

  return (
    <Modal
      backdropClassName={plannerPickerStyles.modalBackdrop}
      bodyClassName={plannerPickerStyles.bodyFrame}
      closeButtonClassName={plannerPickerStyles.closeButton(theme)}
      closeLabel={t.common.close}
      description={
        phase === "main"
          ? t.planner.selectMainDescription
          : t.planner.addSupplementsDescription
      }
      descriptionClassName={plannerPickerStyles.subtitle(theme)}
      footer={
        <>
          {entry !== undefined && (
            <button
              className={plannerPickerStyles.removeButton(theme)}
              disabled={isSaving || isRemoving}
              type="button"
              onClick={() => setIsConfirmingRemove(true)}
            >
              {isRemoving ? t.planner.removing : t.planner.removeMeal}
            </button>
          )}
          {phase === "main" ? (
            <button
              className={plannerPickerStyles.primaryButton(theme)}
              disabled={mainRecipeId === null || isSaving || isRemoving}
              type="button"
              onClick={confirmHighlightedMainRecipe}
            >
              {t.planner.chooseSides}
            </button>
          ) : (
            <button
              className={plannerPickerStyles.secondaryButton(theme)}
              disabled={isSaving || isRemoving}
              type="button"
              onClick={() => {
                setHighlightedMainRecipeId(mainRecipeId);
                setPhase("main");
              }}
            >
              {t.planner.backToMain}
            </button>
          )}
          <button
            className={plannerPickerStyles.primaryButton(theme)}
            disabled={mainRecipe === null || isSaving || isRemoving}
            type="button"
            onClick={saveMealSlot}
          >
            {isSaving ? t.common.saving : t.planner.saveMeal}
          </button>
        </>
      }
      footerClassName={plannerPickerStyles.footer}
      headerClassName={plannerPickerStyles.header}
      panelClassName={plannerPickerStyles.modalPanel(theme)}
      ref={modalPanelRef}
      title={phase === "main" ? t.planner.chooseMainDish : t.planner.chooseSupplements}
      titleClassName={plannerPickerStyles.title}
      titleId={titleId}
      onClose={onClose}
    >
        <div className={plannerPickerStyles.controls}>
          <input
            aria-label={t.browser.searchRecipes}
            className={plannerPickerStyles.searchInput(theme)}
            placeholder={t.planner.mealPickerSearchPlaceholder}
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button
            className={plannerPickerStyles.categoryButton(theme)}
            type="button"
            onClick={() => setIsCategoryFilterOpen(true)}
          >
            {t.filters.categories}
          </button>
          <button
            aria-label={t.browser.openIngredientFilter}
            className={recipeBrowserStyles.filterButton(theme)}
            ref={ingredientFilterButtonRef}
            type="button"
            onClick={(event) =>
              setIngredientPickerPosition((currentPosition) =>
                currentPosition === null
                  ? {
                      x: event.clientX,
                      y: event.clientY,
                    }
                  : null,
              )
            }
          >
            <FilterIcon />
          </button>
          <IngredientFilterChips
            selectedIngredients={selectedIngredients}
            theme={theme}
            onClear={() => setSelectedIngredientIds([])}
            onRemoveIngredient={(ingredientId) =>
              setSelectedIngredientIds((currentIds) =>
                currentIds.filter((currentId) => currentId !== ingredientId),
              )
            }
          />
        </div>
        {isCategoryFilterOpen && (
          <Modal
            backdropClassName={recipeBrowserStyles.categoryFilterBackdrop}
            bodyClassName={recipeBrowserStyles.categoryFilterBody}
            closeButtonClassName={recipeBrowserStyles.modalCloseButton(theme)}
            closeLabel={t.common.close}
            headerClassName={recipeBrowserStyles.categoryFilterHeader}
            panelClassName={recipeBrowserStyles.categoryFilterPanel(theme)}
            title={t.filters.categories}
            titleClassName={recipeBrowserStyles.modalTitle}
            titleId="planner-category-filter-title"
            onClose={() => setIsCategoryFilterOpen(false)}
          >
            {filterSection}
          </Modal>
        )}
        {ingredientPickerPosition !== null && (
          <IngredientPickerPopover
            ingredients={ingredientPickerOptions}
            popoverRef={ingredientPickerRef}
            searchTerm={ingredientPickerSearch}
            selectedIngredientIds={selectedIngredientIds}
            theme={theme}
            x={ingredientPickerPosition.x}
            y={ingredientPickerPosition.y}
            onSearchChange={setIngredientPickerSearch}
            onToggleIngredient={(ingredientId) =>
              setSelectedIngredientIds((currentIds) =>
                currentIds.includes(ingredientId)
                  ? currentIds.filter((currentId) => currentId !== ingredientId)
                  : [...currentIds, ingredientId],
              )
            }
          />
        )}

        <div className={plannerPickerStyles.bodyGrid}>
          <PlannerRecipePickerGrid
            highlightedMainRecipeId={highlightedMainRecipeId}
            phase={phase}
            recipes={visibleRecipes}
            supplementaryRecipeIds={supplementaryRecipeIds}
            theme={theme}
            onSelectMainRecipe={highlightMainRecipe}
            onToggleSupplementaryRecipe={toggleSupplementaryRecipe}
          />
        </div>

        <PlannerRecipePickerSelection
          mainRecipe={mainRecipe}
          supplementaryRecipes={supplementaryRecipes}
          theme={theme}
          onToggleSupplementaryRecipe={toggleSupplementaryRecipe}
        />

        {saveError !== null && (
          <p className={plannerPickerStyles.statusErrorWithOffset(theme)}>{saveError}</p>
        )}

        {isConfirmingRemove && (
          <ConfirmationDialog
            body={t.planner.removeMealBody}
            confirmLabel={t.common.remove}
            isBusy={isRemoving}
            theme={theme}
            title={t.planner.removeMealTitle}
            onCancel={() => setIsConfirmingRemove(false)}
            onConfirm={() => void removeMealSlot()}
          />
        )}
    </Modal>
  );
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function trapFocus(event: KeyboardEvent, container: HTMLElement | null) {
  if (container === null) {
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => element.offsetParent !== null || element === document.activeElement);

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

export default PlannerRecipePickerModal;
