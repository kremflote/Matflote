import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useIngredients, useLanguage } from "../contexts";
import type { IIngredient, IngredientTag, MeasurementUnit } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealSlot } from "../interfaces/IMeal";
import type { IRecipe, RecipeTag } from "../interfaces/IRecipe";
import type { MealPlanEntryRequest } from "../services/mealPlanService";
import { plannerPickerStyles, type SiteTheme } from "../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowser/recipeBrowserStyles";
import {
  getSupplementaryRole,
  isMainDish,
  matchesSearch,
  matchesIngredientSearch,
  matchesSelectedIngredients,
  matchesSelectedRecipeTags,
  maxSupplementaryItems,
} from "./plannerRecipePicker/plannerRecipePickerFilters";
import { matchesIngredientTags } from "./recipeBrowser/browserFilterUtils";
import BrowserFilterSection from "./recipeBrowser/BrowserFilterSection";
import {
  FilterIcon,
  IngredientFilterChips,
  IngredientPickerPopover,
} from "./plannerRecipePicker/PlannerRecipePickerIngredients";
import PlannerRecipePickerGrid from "./plannerRecipePicker/PlannerRecipePickerGrid";
import PlannerRecipePickerSelection, {
  type PlannerPickerSelectedItem,
} from "./plannerRecipePicker/PlannerRecipePickerSelection";
import Modal from "./Modal";
import SearchField from "./SearchField";

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
  const [selectedIngredientTags, setSelectedIngredientTags] = useState<IngredientTag[]>([]);
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
  const visibleRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) =>
          isMainDish(recipe) &&
          matchesSelectedRecipeTags(recipe, selectedMainRecipeTags),
        )
        .filter((recipe) => matchesSelectedIngredients(recipe, selectedIngredientIds))
        .filter((recipe) => matchesSearch(recipe, searchTerm))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [
      recipes,
      searchTerm,
      selectedIngredientIds,
      selectedMainRecipeTags,
    ],
  );

  const visiblePickerIngredients = useMemo(
    () =>
      ingredients
        .filter((ingredient) => matchesIngredientSearch(ingredient, searchTerm))
        .filter((ingredient) => matchesIngredientTags(ingredient, selectedIngredientTags))
        .sort((first, second) => first.ingredientName.localeCompare(second.ingredientName)),
    [ingredients, searchTerm, selectedIngredientTags],
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
  const selectedPickerItems: PlannerPickerSelectedItem[] = [
    ...(mainRecipe !== null && mainRecipeSelection !== null
      ? [toSelectedRecipeItem(mainRecipe, mainRecipeSelection)]
      : []),
    ...(mainIngredient !== null && mainIngredientSelection !== null
      ? [toSelectedIngredientItem(mainIngredient, mainIngredientSelection, t.enums.measurementUnits)]
      : []),
    ...supplementaryRecipeSelections
      .map((selection) => {
        const recipe = recipeById.get(selection.recipeId);
        return recipe === undefined ? null : toSelectedRecipeItem(recipe, selection);
      })
      .filter((item): item is PlannerPickerSelectedItem => item !== null),
    ...supplementaryIngredientSelections
      .map((selection) => {
        const ingredient = ingredientById.get(selection.ingredientId);
        return ingredient === undefined
          ? null
          : toSelectedIngredientItem(ingredient, selection, t.enums.measurementUnits);
      })
      .filter((item): item is PlannerPickerSelectedItem => item !== null),
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

  const selectOrUpdateMealRecipe = (recipe: IRecipe, portions = recipe.portions) => {
    if (mainRecipeSelection?.recipeId === recipe.recipeId) {
      removeRecipeSelection(recipe.recipeId);
      return;
    }

    if (supplementaryRecipeSelections.some((selection) => selection.recipeId === recipe.recipeId)) {
      removeRecipeSelection(recipe.recipeId);
      return;
    }

    if (mainRecipeSelection === null && mainIngredientSelection === null) {
      selectMainRecipe(recipe, portions);
      return;
    }

    updateSupplementaryRecipe(recipe, portions);
  };

  const selectOrUpdateMealIngredient = (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => {
    if (mainIngredientSelection?.ingredientId === ingredient.ingredientId) {
      removeIngredientSelection(ingredient.ingredientId);
      return;
    }

    if (supplementaryIngredientSelections.some((selection) => selection.ingredientId === ingredient.ingredientId)) {
      removeIngredientSelection(ingredient.ingredientId);
      return;
    }

    if (mainRecipeSelection === null && mainIngredientSelection === null) {
      selectMainIngredient(ingredient, amount, unit);
      return;
    }

    updateSupplementaryIngredient(ingredient, amount, unit);
  };

  const updateSupplementaryRecipe = (recipe: IRecipe, portions = recipe.portions) => {
    setSupplementaryRecipeSelections((currentSelections) => {
      if (currentSelections.some((selection) => selection.recipeId === recipe.recipeId)) {
        return currentSelections.map((selection) =>
          selection.recipeId === recipe.recipeId ? { recipeId: recipe.recipeId, portions } : selection,
        );
      }

      if (currentSelections.length + supplementaryIngredientSelections.length >= maxSupplementaryItems) {
        return currentSelections;
      }

      return [...currentSelections, { recipeId: recipe.recipeId, portions }];
    });
  };

  const updateMealRecipePortions = (recipe: IRecipe, portions = recipe.portions) => {
    setMainRecipeSelection((currentSelection) =>
      currentSelection?.recipeId === recipe.recipeId ? { recipeId: recipe.recipeId, portions } : currentSelection,
    );
    setSupplementaryRecipeSelections((currentSelections) =>
      currentSelections.map((selection) =>
        selection.recipeId === recipe.recipeId ? { recipeId: recipe.recipeId, portions } : selection,
      ),
    );
  };

  const updateSupplementaryIngredient = (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => {
    setSupplementaryIngredientSelections((currentSelections) => {
      if (currentSelections.some((selection) => selection.ingredientId === ingredient.ingredientId)) {
        return currentSelections.map((selection) =>
          selection.ingredientId === ingredient.ingredientId
            ? { ingredientId: ingredient.ingredientId, amount, unit }
            : selection,
        );
      }

      if (supplementaryRecipeSelections.length + currentSelections.length >= maxSupplementaryItems) {
        return currentSelections;
      }

      return [...currentSelections, { ingredientId: ingredient.ingredientId, amount, unit }];
    });
  };

  const updateMealIngredientAmount = (ingredient: IIngredient, amount: number, unit: MeasurementUnit) => {
    setMainIngredientSelection((currentSelection) =>
      currentSelection?.ingredientId === ingredient.ingredientId
        ? { ingredientId: ingredient.ingredientId, amount, unit }
        : currentSelection,
    );
    setSupplementaryIngredientSelections((currentSelections) =>
      currentSelections.map((selection) =>
        selection.ingredientId === ingredient.ingredientId
          ? { ingredientId: ingredient.ingredientId, amount, unit }
          : selection,
      ),
    );
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

  const removeSelectedPickerItem = (item: PlannerPickerSelectedItem) => {
    if (item.kind === "recipe") {
      removeRecipeSelection(item.id);
      return;
    }

    removeIngredientSelection(item.id);
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
    <BrowserFilterSection
      mode={browserMode}
      selectedIngredientTags={selectedIngredientTags}
      selectedRecipeTags={selectedMainRecipeTags}
      setSelectedIngredientTags={setSelectedIngredientTags}
      setSelectedRecipeTags={setSelectedMainRecipeTags}
      theme={theme}
      variant="panel"
    />
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
              items={selectedPickerItems}
              theme={theme}
              onRemoveItem={removeSelectedPickerItem}
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
              className={plannerPickerStyles.mobileCancelButton(theme)}
              disabled={isSaving}
              type="button"
              onClick={onClose}
            >
              {t.common.cancel}
            </button>
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
          <SearchField
            aria-label={browserMode === "recipes" ? t.browser.searchRecipes : t.browser.searchIngredients}
            inputClassName={plannerPickerStyles.searchInput(theme)}
            placeholder={t.planner.mealPickerSearchPlaceholder}
            ref={searchInputRef}
            theme={theme}
            value={searchTerm}
            onChange={setSearchTerm}
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
          {browserMode === "recipes" && (
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
          )}
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
              onClick={() => {
                setBrowserMode("ingredients");
                setIngredientPickerPosition(null);
              }}
            >
              {t.cookbook.ingredients}
            </button>
          </div>
          <IngredientFilterChips
            mode={browserMode}
            selectedIngredientTags={selectedIngredientTags}
            selectedIngredients={selectedIngredients}
            selectedRecipeTags={selectedMainRecipeTags}
            theme={theme}
            onClear={() => {
              setSelectedIngredientIds([]);
              setSelectedIngredientTags([]);
              setSelectedMainRecipeTags([]);
            }}
            onRemoveIngredient={(ingredientId) =>
              setSelectedIngredientIds((currentIds) =>
                currentIds.filter((currentId) => currentId !== ingredientId),
              )
            }
            onRemoveIngredientTag={(tag) =>
              setSelectedIngredientTags((currentTags) =>
                currentTags.filter((currentTag) => currentTag !== tag),
              )
            }
            onRemoveRecipeTag={(tag) =>
              setSelectedMainRecipeTags((currentTags) =>
                currentTags.filter((currentTag) => currentTag !== tag),
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
              selectedIngredients={[
                ...(mainIngredientSelection === null ? [] : [mainIngredientSelection]),
                ...supplementaryIngredientSelections,
              ]}
              selectedRecipes={[
                ...(mainRecipeSelection === null ? [] : [mainRecipeSelection]),
                ...supplementaryRecipeSelections,
              ]}
              theme={theme}
              onSelectIngredient={(ingredient, amount, unit) =>
                selectOrUpdateMealIngredient(ingredient, amount, unit)
              }
              onSelectRecipe={(recipe, portions) =>
                selectOrUpdateMealRecipe(recipe, portions)
              }
              onUpdateIngredient={(ingredient, amount, unit) =>
                updateMealIngredientAmount(ingredient, amount, unit)
              }
              onUpdateRecipe={(recipe, portions) =>
                updateMealRecipePortions(recipe, portions)
              }
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

function toSelectedRecipeItem(recipe: IRecipe, selection: SelectedPlannerRecipe): PlannerPickerSelectedItem {
  return {
    id: recipe.recipeId,
    imageUrl: recipe.imageUrl,
    kind: "recipe",
    name: recipe.name,
    valueLabel: `${formatNumber(selection.portions)}x`,
  };
}

function toSelectedIngredientItem(
  ingredient: IIngredient,
  selection: SelectedPlannerIngredient,
  unitLabels: Record<MeasurementUnit, string>,
): PlannerPickerSelectedItem {
  return {
    id: ingredient.ingredientId,
    imageUrl: ingredient.imageUrl,
    kind: "ingredient",
    name: ingredient.ingredientName,
    valueLabel: `${formatNumber(selection.amount)} ${unitLabels[selection.unit]}`,
  };
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
