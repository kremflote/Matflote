import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useIngredientTagCategories, useIngredients, useLanguage } from "../contexts";
import type { IIngredient, IngredientTag, MeasurementUnit } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealSlot } from "../interfaces/IMeal";
import type { IRecipe, RecipeTag } from "../interfaces/IRecipe";
import type { MealPlanEntryRequest } from "../services/mealPlanService";
import { plannerPickerStyles, type SiteTheme } from "../styles/appStyles";
import { formatRecipeTagGroupName, getRecipeTagGroupsWithCustomTags, recipeTagGroups, recipeTags } from "./recipeBrowser/formOptions";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowser/recipeBrowserStyles";
import {
  getSupplementaryRole,
  isMainDish,
  mainProteinFilters,
  matchesSearch,
  matchesIngredientSearch,
  matchesSelectedIngredients,
  matchesSelectedIngredientTags,
  matchesSelectedRecipeTags,
  maxSupplementaryItems,
  recipeHasIngredientTag,
  toggleSelection,
} from "./plannerRecipePicker/plannerRecipePickerFilters";
import { FilterGroup, GroupedFilterGroup } from "./recipeBrowser/BrowserFilterGroups";
import {
  FilterIcon,
  IngredientFilterChips,
  IngredientPickerPopover,
} from "./plannerRecipePicker/PlannerRecipePickerIngredients";
import PlannerRecipePickerGrid from "./plannerRecipePicker/PlannerRecipePickerGrid";
import PlannerRecipePickerSelection from "./plannerRecipePicker/PlannerRecipePickerSelection";
import Modal from "./Modal";

type PlannerRecipePickerModalProps = {
  date: string;
  entry?: IMealPlanEntry;
  recipes: IRecipe[];
  slot: MealSlot;
  theme: SiteTheme;
  onClose: () => void;
  onSave: (entryId: number | null, request: MealPlanEntryRequest) => Promise<void>;
};

type SelectedPlannerRecipe = {
  recipeId: number;
  portions: number;
};

type SelectedPlannerIngredient = {
  ingredientId: number;
  amount: number;
  unit: MeasurementUnit;
};

type PickerBrowserMode = "recipes" | "ingredients";

function PlannerRecipePickerModal({
  date,
  entry,
  recipes,
  slot,
  theme,
  onClose,
  onSave,
}: PlannerRecipePickerModalProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const { ingredients } = useIngredients();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const initialMainRecipe = entry?.recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .find((plannedRecipe) => plannedRecipe.role === "Main" && plannedRecipe.recipeId !== null);
  const initialMainIngredient = entry?.recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .find((plannedRecipe) => plannedRecipe.role === "Main" && plannedRecipe.ingredientId !== null);
  const initialSupplementaryRecipes =
    entry?.recipes
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .filter((plannedRecipe) => plannedRecipe.role !== "Main" && plannedRecipe.recipeId !== null)
      .map((plannedRecipe) => ({
        recipeId: plannedRecipe.recipeId!,
        portions: plannedRecipe.portions ?? recipeByIdFallback(recipes, plannedRecipe.recipeId)?.portions ?? 1,
      })) ?? [];
  const initialSupplementaryIngredients =
    entry?.recipes
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .filter((plannedRecipe) => plannedRecipe.role !== "Main" && plannedRecipe.ingredientId !== null)
      .map((plannedRecipe) => ({
        ingredientId: plannedRecipe.ingredientId!,
        amount: plannedRecipe.amount ?? 1,
      unit: plannedRecipe.unit ?? ("Gram" as MeasurementUnit),
      })) ?? [];
  const [browserMode, setBrowserMode] = useState<PickerBrowserMode>("recipes");
  const [searchTerm, setSearchTerm] = useState("");
  const [mainRecipeSelection, setMainRecipeSelection] = useState<SelectedPlannerRecipe | null>(
    initialMainRecipe === undefined ? null : {
      recipeId: initialMainRecipe.recipeId!,
      portions: initialMainRecipe.portions ?? recipeByIdFallback(recipes, initialMainRecipe.recipeId)?.portions ?? 1,
    },
  );
  const [mainIngredientSelection, setMainIngredientSelection] = useState<SelectedPlannerIngredient | null>(
    initialMainIngredient === undefined ? null : {
      ingredientId: initialMainIngredient.ingredientId!,
      amount: initialMainIngredient.amount ?? 1,
      unit: initialMainIngredient.unit ?? "Gram",
    },
  );
  const [supplementaryRecipeSelections, setSupplementaryRecipeSelections] =
    useState<SelectedPlannerRecipe[]>(initialSupplementaryRecipes);
  const [supplementaryIngredientSelections, setSupplementaryIngredientSelections] =
    useState<SelectedPlannerIngredient[]>(initialSupplementaryIngredients);
  const [selectedMainProteinTags, setSelectedMainProteinTags] = useState<IngredientTag[]>([]);
  const [selectedMainRecipeTags, setSelectedMainRecipeTags] = useState<RecipeTag[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [ingredientPickerSearch, setIngredientPickerSearch] = useState("");
  const [ingredientPickerPosition, setIngredientPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const modalPanelRef = useRef<HTMLElement | null>(null);
  const ingredientFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const ingredientPickerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const recipeById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.recipeId, recipe])),
    [recipes],
  );
  const ingredientById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.ingredientId, ingredient])),
    [ingredients],
  );
  const mainRecipeId = mainRecipeSelection?.recipeId ?? null;
  const supplementaryRecipeIds = supplementaryRecipeSelections.map((selection) => selection.recipeId);
  const supplementaryIngredientIds = supplementaryIngredientSelections.map((selection) => selection.ingredientId);

  const visibleRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) =>
          isMainDish(recipe) &&
          matchesSelectedIngredientTags(recipe, selectedMainProteinTags) &&
          matchesSelectedRecipeTags(recipe, selectedMainRecipeTags),
        )
        .filter((recipe) => matchesSelectedIngredients(recipe, selectedIngredientIds))
        .filter((recipe) => matchesSearch(recipe, searchTerm))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [
      mainRecipeId,
      recipes,
      searchTerm,
      selectedIngredientIds,
      selectedMainProteinTags,
      selectedMainRecipeTags,
    ],
  );

  const visiblePickerIngredients = useMemo(
    () =>
      ingredients
        .filter((ingredient) => matchesIngredientSearch(ingredient, searchTerm))
        .sort((first, second) => first.ingredientName.localeCompare(second.ingredientName)),
    [ingredients, searchTerm],
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
  const mainRecipeCustomTags = Array.from(availableMainRecipeTags)
    .filter((tag) => !recipeTags.includes(tag));
  const liveRecipeTagGroups = getRecipeTagGroupsWithCustomTags(mainRecipeCustomTags, "style", ingredientTagCategories);
  const recipeTagGroupLabels = ingredientTagCategories.length === 0
    ? t.filters.recipeTagGroups
    : Object.fromEntries(
        ingredientTagCategories.map((category) => [
          category.ingredientTagCategoryId.toString(),
          formatRecipeTagGroupName(category.name, t.filters.recipeTagGroups),
        ]),
      );

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
  const mainIngredient =
    mainIngredientSelection === null
      ? null
      : ingredientById.get(mainIngredientSelection.ingredientId) ?? null;
  const mainSelectionLabel =
    mainRecipe !== null && mainRecipeSelection !== null
      ? formatRecipeSelectionLabel(mainRecipe.name, mainRecipeSelection.portions)
      : mainIngredient !== null && mainIngredientSelection !== null
        ? formatIngredientSelectionLabel(
            mainIngredient.ingredientName,
            mainIngredientSelection.amount,
            mainIngredientSelection.unit,
            t.enums.measurementUnits,
          )
        : null;
  const supplementarySelectionLabels = [
    ...supplementaryRecipeSelections
      .map((selection) => {
        const recipe = recipeById.get(selection.recipeId);
        return recipe === undefined ? null : formatRecipeSelectionLabel(recipe.name, selection.portions);
      })
      .filter((label): label is string => label !== null),
    ...supplementaryIngredientSelections
      .map((selection) => {
        const ingredient = ingredientById.get(selection.ingredientId);
        return ingredient === undefined
          ? null
          : formatIngredientSelectionLabel(
              ingredient.ingredientName,
              selection.amount,
              selection.unit,
              t.enums.measurementUnits,
            );
      })
      .filter((label): label is string => label !== null),
  ];

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

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
  }, [isCategoryFilterOpen, onClose]);

  const selectMainRecipe = (recipe: IRecipe, portions: number) => {
    setMainRecipeSelection({ recipeId: recipe.recipeId, portions });
    setMainIngredientSelection(null);
  };

  const selectMainIngredient = (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => {
    setMainIngredientSelection({ ingredientId: ingredient.ingredientId, amount, unit });
    setMainRecipeSelection(null);
  };

  const toggleMealRecipe = (recipe: IRecipe, portions = recipe.portions) => {
    if (mainRecipeSelection?.recipeId === recipe.recipeId) {
      setMainRecipeSelection(null);
      return;
    }

    if (mainRecipeSelection === null && mainIngredientSelection === null) {
      selectMainRecipe(recipe, portions);
      return;
    }

    toggleSupplementaryRecipe(recipe, portions);
  };

  const toggleMealIngredient = (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => {
    if (mainIngredientSelection?.ingredientId === ingredient.ingredientId) {
      setMainIngredientSelection(null);
      return;
    }

    if (mainRecipeSelection === null && mainIngredientSelection === null) {
      selectMainIngredient(ingredient, amount, unit);
      return;
    }

    toggleSupplementaryIngredient(ingredient, amount, unit);
  };

  const toggleSupplementaryRecipe = (recipe: IRecipe, portions = recipe.portions) => {
    setSupplementaryRecipeSelections((currentSelections) => {
      if (currentSelections.some((selection) => selection.recipeId === recipe.recipeId)) {
        return currentSelections.filter((selection) => selection.recipeId !== recipe.recipeId);
      }

      if (currentSelections.length + supplementaryIngredientSelections.length >= maxSupplementaryItems) {
        return currentSelections;
      }

      return [...currentSelections, { recipeId: recipe.recipeId, portions }];
    });
  };

  const toggleSupplementaryIngredient = (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => {
    setSupplementaryIngredientSelections((currentSelections) => {
      if (currentSelections.some((selection) => selection.ingredientId === ingredient.ingredientId)) {
        return currentSelections.filter((selection) => selection.ingredientId !== ingredient.ingredientId);
      }

      if (supplementaryRecipeSelections.length + currentSelections.length >= maxSupplementaryItems) {
        return currentSelections;
      }

      return [...currentSelections, { ingredientId: ingredient.ingredientId, amount, unit }];
    });
  };

  const clearMealSelection = () => {
    setMainRecipeSelection(null);
    setMainIngredientSelection(null);
    setSupplementaryRecipeSelections([]);
    setSupplementaryIngredientSelections([]);
  };

  const removeRecipeSelection = (recipeId: number) => {
    setMainRecipeSelection((currentSelection) =>
      currentSelection?.recipeId === recipeId ? null : currentSelection,
    );
    setSupplementaryRecipeSelections((currentSelections) =>
      currentSelections.filter((selection) => selection.recipeId !== recipeId),
    );
  };

  const removeIngredientSelection = (ingredientId: number) => {
    setMainIngredientSelection((currentSelection) =>
      currentSelection?.ingredientId === ingredientId ? null : currentSelection,
    );
    setSupplementaryIngredientSelections((currentSelections) =>
      currentSelections.filter((selection) => selection.ingredientId !== ingredientId),
    );
  };

  const saveMealSlot = async () => {
    if (mainRecipe === null && mainIngredient === null && entry === undefined) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const recipesToSave =
        [
          ...(mainRecipeSelection === null
            ? []
            : [{
                recipeId: mainRecipeSelection.recipeId,
                ingredientId: null,
                role: "Main" as const,
                sortOrder: 0,
                portions: mainRecipeSelection.portions,
                amount: null,
                unit: null,
              }]),
          ...(mainIngredientSelection === null
            ? []
            : [{
                recipeId: null,
                ingredientId: mainIngredientSelection.ingredientId,
                role: "Main" as const,
                sortOrder: 0,
                portions: null,
                amount: mainIngredientSelection.amount,
                unit: mainIngredientSelection.unit,
              }]),
          ...supplementaryRecipeSelections.map((selection, index) => {
            const recipe = recipeById.get(selection.recipeId);
            return {
              recipeId: selection.recipeId,
              ingredientId: null,
              role: recipe === undefined ? "Side" as const : getSupplementaryRole(recipe),
              sortOrder: index + 1,
              portions: selection.portions,
              amount: null,
              unit: null,
            };
          }),
          ...supplementaryIngredientSelections.map((selection, index) => ({
            recipeId: null,
            ingredientId: selection.ingredientId,
            role: "Side" as const,
            sortOrder: supplementaryRecipeSelections.length + index + 1,
            portions: null,
            amount: selection.amount,
            unit: selection.unit,
          })),
        ];

      await onSave(entry?.mealPlanEntryId ?? null, {
        date,
        slot,
        notes: entry?.notes ?? null,
        recipes: recipesToSave,
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
      <FilterGroup
        disabledValues={mainProteinFilters.filter(
          (filter) => !availableMainProteinTags.has(filter),
        )}
        selectedValues={selectedMainProteinTags}
        theme={theme}
        title={t.filters.protein}
        values={mainProteinFilters}
        formatValue={(value) => t.enums.ingredientTags[value] ?? formatLabel(value)}
        onToggle={(value) => toggleSelection(value, setSelectedMainProteinTags)}
      />
      <GroupedFilterGroup
        disabledValues={recipeTags.filter(
          (filter) => !availableMainRecipeTags.has(filter),
        )}
        formatValue={(value) => t.enums.recipeTags[value] ?? formatLabel(value)}
        groupLabels={recipeTagGroupLabels}
        groups={ingredientTagCategories.length === 0 ? recipeTagGroups : liveRecipeTagGroups}
        selectedValues={selectedMainRecipeTags}
        theme={theme}
        title={t.filters.tags}
        onToggle={(value) => toggleSelection(value, setSelectedMainRecipeTags)}
      />
    </aside>
  );

  return (
    <Modal
      backdropClassName={plannerPickerStyles.modalBackdrop}
      bodyClassName={plannerPickerStyles.bodyFrame}
      closeButtonClassName={plannerPickerStyles.closeButton(theme)}
      closeLabel={t.common.close}
      description={
        t.planner.selectMainDescription
      }
      descriptionClassName={plannerPickerStyles.subtitle(theme)}
      footer={
        <div className={plannerPickerStyles.footerContent}>
          <div className={plannerPickerStyles.footerSelectionRow}>
            <PlannerRecipePickerSelection
              mainLabel={mainSelectionLabel}
              supplementaryLabels={supplementarySelectionLabels}
              theme={theme}
            />
            <button
              className={plannerPickerStyles.footerClearButton(theme)}
              disabled={
                mainRecipeSelection === null &&
                mainIngredientSelection === null &&
                supplementaryRecipeSelections.length === 0 &&
                supplementaryIngredientSelections.length === 0
              }
              type="button"
              onClick={clearMealSelection}
            >
              {t.common.clear}
            </button>
          </div>
          <div className={plannerPickerStyles.footerActions}>
            <button
              className={plannerPickerStyles.primaryButton(theme)}
              disabled={(mainRecipe === null && mainIngredient === null && entry === undefined) || isSaving}
              type="button"
              onClick={saveMealSlot}
            >
              {isSaving ? t.common.saving : t.planner.saveMeal}
            </button>
          </div>
        </div>
      }
      footerClassName={plannerPickerStyles.footer}
      headerClassName={plannerPickerStyles.header}
      panelClassName={plannerPickerStyles.modalPanel(theme)}
      ref={modalPanelRef}
      title={t.planner.chooseMainDish}
      titleClassName={plannerPickerStyles.title}
      titleId={titleId}
      onClose={onClose}
    >
        <div className={plannerPickerStyles.controls}>
          <input
            aria-label={browserMode === "recipes" ? t.browser.searchRecipes : t.browser.searchIngredients}
            className={plannerPickerStyles.searchInput(theme)}
            placeholder={t.planner.mealPickerSearchPlaceholder}
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button
            aria-label={t.filters.categories}
            className={plannerPickerStyles.categoryButton(theme)}
            type="button"
            onClick={() => setIsCategoryFilterOpen(true)}
          >
            <CategoryIcon />
            <span className={plannerPickerStyles.categoryButtonLabel}>
              {t.filters.categories}
            </span>
          </button>
          <button
            aria-label={t.browser.openIngredientFilter}
            className={plannerPickerStyles.filterButton(theme)}
            ref={ingredientFilterButtonRef}
            type="button"
            onClick={(event) => {
              const buttonRect = event.currentTarget.getBoundingClientRect();
              setIngredientPickerPosition((currentPosition) =>
                currentPosition === null
                  ? {
                      x: buttonRect.left,
                      y: buttonRect.top,
                    }
                  : null,
              );
            }}
          >
            <FilterIcon />
          </button>
          <div className={plannerPickerStyles.browserModeSwitch(theme)} role="group" aria-label={t.cookbook.cookbookSections}>
            <button
              className={plannerPickerStyles.browserModeOption(theme, browserMode === "recipes")}
              type="button"
              onClick={() => setBrowserMode("recipes")}
            >
              {t.cookbook.recipes}
            </button>
            <button
              className={plannerPickerStyles.browserModeOption(theme, browserMode === "ingredients")}
              type="button"
              onClick={() => setBrowserMode("ingredients")}
            >
              {t.cookbook.ingredients}
            </button>
          </div>
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

        <div className={plannerPickerStyles.bodyScrollFrame}>
          <div className={plannerPickerStyles.bodyGrid}>
            <PlannerRecipePickerGrid
              browserMode={browserMode}
              ingredients={visiblePickerIngredients}
              recipes={visibleRecipes}
              selectedIngredientIds={[
                ...(mainIngredientSelection === null ? [] : [mainIngredientSelection.ingredientId]),
                ...supplementaryIngredientIds,
              ]}
              selectedRecipeIds={[
                ...(mainRecipeSelection === null ? [] : [mainRecipeSelection.recipeId]),
                ...supplementaryRecipeIds,
              ]}
              theme={theme}
              onAddIngredient={(ingredient, amount, unit) =>
                toggleMealIngredient(ingredient, amount, unit)
              }
              onAddRecipe={(recipe, portions) =>
                toggleMealRecipe(recipe, portions)
              }
              onRemoveIngredient={removeIngredientSelection}
              onRemoveRecipe={removeRecipeSelection}
            />
          </div>
        </div>

        {saveError !== null && (
          <p className={plannerPickerStyles.statusErrorWithOffset(theme)}>{saveError}</p>
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

function formatRecipeSelectionLabel(name: string, portions: number) {
  return `${name} (${formatNumber(portions)}x)`;
}

function formatIngredientSelectionLabel(
  name: string,
  amount: number,
  unit: MeasurementUnit,
  unitLabels: Record<MeasurementUnit, string>,
) {
  return `${name} (${formatNumber(amount)} ${unitLabels[unit]})`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function recipeByIdFallback(recipes: IRecipe[], recipeId: number | null) {
  return recipeId === null ? undefined : recipes.find((recipe) => recipe.recipeId === recipeId);
}

function CategoryIcon() {
  return (
    <svg aria-hidden="true" className={plannerControlsIconClassName} viewBox="0 0 24 24">
      <path
        d="M4 5.5h7v7H4v-7Zm9 0h7v7h-7v-7Zm-9 9h7v4H4v-4Zm9 0h7v4h-7v-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

const plannerControlsIconClassName = "h-4 w-4 fill-current";

export default PlannerRecipePickerModal;
