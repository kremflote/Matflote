import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useIngredientTagCategories, useIngredients, useLanguage } from "../contexts";
import type { IIngredient, IngredientTag, MeasurementUnit } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealSlot } from "../interfaces/IMeal";
import type { IRecipe, RecipeTag } from "../interfaces/IRecipe";
import type { MealPlanEntryRequest } from "../services/mealPlanService";
import { plannerPickerStyles } from "../styles/appStyles";
import { buildSystemTagNameLookup } from "../utils/tagCatalog";
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
import {
  type SelectedPlannerRecipe,
  type SelectedPlannerIngredient,
  type PickerBrowserMode,
  toSelectedRecipeItem,
  toSelectedIngredientItem,
  getInitialRecipeTagFilters,
  buildAvailableTagNames,
  findAvailableTagName,
  uniqueValues,
  toggleTagFilter,
  toMealPlanItems,
  getInitialSelections,
} from "./plannerRecipePicker/pickerSelection";

type PlannerRecipePickerModalProps = {
  date: string;
  entry?: IMealPlanEntry;
  recipes: IRecipe[];
  slot: MealSlot;
  onClose: () => void;
  onSave: (entryId: number | null, request: MealPlanEntryRequest) => Promise<void>;
};

function PlannerRecipePickerModal({
  date,
  entry,
  recipes,
  slot,
  onClose,
  onSave,
}: PlannerRecipePickerModalProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const { ingredients } = useIngredients();
  const { ingredientTagCategories } = useIngredientTagCategories();
  const initialSelections = getInitialSelections(entry, recipes);
  const [browserMode, setBrowserMode] = useState<PickerBrowserMode>("recipes");
  const [searchTerm, setSearchTerm] = useState("");
  const [mainRecipeSelection, setMainRecipeSelection] =
    useState<SelectedPlannerRecipe | null>(initialSelections.mainRecipe);
  const [mainIngredientSelection, setMainIngredientSelection] =
    useState<SelectedPlannerIngredient | null>(initialSelections.mainIngredient);
  const [supplementaryRecipeSelections, setSupplementaryRecipeSelections] =
    useState<SelectedPlannerRecipe[]>(initialSelections.supplementaryRecipes);
  const [supplementaryIngredientSelections, setSupplementaryIngredientSelections] =
    useState<SelectedPlannerIngredient[]>(initialSelections.supplementaryIngredients);
  const [selectedIngredientTags, setSelectedIngredientTags] = useState<IngredientTag[]>([]);
  const [selectedMainRecipeTags, setSelectedMainRecipeTags] =
    useState<RecipeTag[]>(() => getInitialRecipeTagFilters(slot));
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [ingredientPickerSearch, setIngredientPickerSearch] = useState("");
  const [ingredientPickerPosition, setIngredientPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ingredientFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const ingredientPickerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const hasAppliedBreakfastBreadIngredientFilterRef = useRef(false);

  const recipeById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.recipeId, recipe])),
    [recipes],
  );
  const ingredientById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.ingredientId, ingredient])),
    [ingredients],
  );
  const systemTagNames = useMemo(
    () => buildSystemTagNameLookup(ingredientTagCategories),
    [ingredientTagCategories],
  );
  const availableTagNames = useMemo(
    () => buildAvailableTagNames(ingredientTagCategories, recipes, ingredients),
    [ingredientTagCategories, recipes, ingredients],
  );
  const breadTagName = systemTagNames.get("Format.Bread") ?? "Bread";
  const toppingTagName = systemTagNames.get("FoodRole.Topping") ?? "Pålegg";
  const quickRecipeFilters = useMemo(
    () =>
      [
        systemTagNames.get("Protein.Chicken") ?? "Chicken",
        systemTagNames.get("Protein.Beef") ?? "Beef",
        systemTagNames.get("Protein.Fish") ?? "Fish",
      ]
        .filter((tagName) => availableTagNames.has(tagName))
        .map((tagName) => tagName as RecipeTag),
    [availableTagNames, systemTagNames],
  );
  const quickIngredientFilters = useMemo(
    () =>
      uniqueValues([
        systemTagNames.get("FoodRole.Topping") ?? "Pålegg",
        findAvailableTagName(availableTagNames, ["Condiments", "Condiment", "Sauce"]),
      ])
        .filter((tagName) => availableTagNames.has(tagName))
        .map((tagName) => tagName as IngredientTag),
    [availableTagNames, systemTagNames],
  );
  const mainRecipeId = mainRecipeSelection?.recipeId ?? null;
  const visibleRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) =>
          isMainDish(recipe) &&
          matchesSelectedRecipeTags(recipe, selectedMainRecipeTags),
        )
        .filter((recipe) => matchesSelectedIngredients(recipe, selectedIngredientIds, recipeById))
        .filter((recipe) => matchesSearch(recipe, searchTerm))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [
      recipes,
      recipeById,
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
  const hasSelectedBreakfastBreadRecipe =
    slot === "Breakfast" &&
    [
      ...(mainRecipeSelection === null ? [] : [mainRecipeSelection]),
      ...supplementaryRecipeSelections,
    ].some((selection) => recipeById.get(selection.recipeId)?.tags.includes(breadTagName) === true);

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

  const switchToIngredientBrowser = () => {
    if (
      browserMode === "recipes" &&
      hasSelectedBreakfastBreadRecipe &&
      !hasAppliedBreakfastBreadIngredientFilterRef.current &&
      selectedIngredientTags.length === 0 &&
      ingredients.some((ingredient) => ingredient.tags.includes(toppingTagName))
    ) {
      setSelectedIngredientTags([toppingTagName]);
      hasAppliedBreakfastBreadIngredientFilterRef.current = true;
    }

    setBrowserMode("ingredients");
    setIngredientPickerPosition(null);
  };

  const saveMealSlot = async () => {
    if (mainRecipe === null && mainIngredient === null && entry === undefined) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const recipesToSave = toMealPlanItems({
        mainRecipe: mainRecipeSelection,
        mainIngredient: mainIngredientSelection,
        supplementaryRecipes: supplementaryRecipeSelections,
        supplementaryIngredients: supplementaryIngredientSelections,
        roleOf: (recipeId) => {
          const recipe = recipeById.get(recipeId);
          return recipe === undefined ? "Side" : getSupplementaryRole(recipe, systemTagNames);
        },
      });

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
      variant="panel"
    />
  );

  return (
    <Modal
      backdropClassName={plannerPickerStyles.modalBackdrop}
      bodyClassName={plannerPickerStyles.bodyFrame}
      closeButtonClassName={plannerPickerStyles.closeButton}
      closeLabel={t.common.close}
      description={
        t.planner.selectMainDescription
      }
      descriptionClassName={plannerPickerStyles.subtitle}
      footer={
        <div className={plannerPickerStyles.footerContent}>
          <div className={plannerPickerStyles.footerSelectionRow}>
            <PlannerRecipePickerSelection
              items={selectedPickerItems}
              onRemoveItem={removeSelectedPickerItem}
            />
            <button
              className={plannerPickerStyles.footerClearButton}
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
              className={plannerPickerStyles.mobileCancelButton}
              disabled={isSaving}
              type="button"
              onClick={onClose}
            >
              {t.common.cancel}
            </button>
            <button
              className={plannerPickerStyles.primaryButton}
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
      panelClassName={plannerPickerStyles.modalPanel}
      title={t.planner.chooseMainDish}
      titleClassName={plannerPickerStyles.title}
      titleId={titleId}
      onClose={onClose}
    >
        <div className={plannerPickerStyles.controls}>
          <SearchField
            aria-label={browserMode === "recipes" ? t.browser.searchRecipes : t.browser.searchIngredients}
            inputClassName={plannerPickerStyles.searchInput}
            placeholder={t.planner.mealPickerSearchPlaceholder}
            ref={searchInputRef}
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <button
            aria-label={t.filters.categories}
            className={plannerPickerStyles.categoryButton}
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
              className={plannerPickerStyles.filterButton}
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
          <div className={plannerPickerStyles.browserModeSwitch} role="group" aria-label={t.cookbook.cookbookSections}>
            <button
              className={plannerPickerStyles.browserModeOption(browserMode === "recipes")}
              type="button"
              onClick={() => setBrowserMode("recipes")}
            >
              {t.cookbook.recipes}
            </button>
            <button
              className={plannerPickerStyles.browserModeOption(browserMode === "ingredients")}
              type="button"
              onClick={switchToIngredientBrowser}
            >
              {t.cookbook.ingredients}
            </button>
          </div>
          <IngredientFilterChips
            mode={browserMode}
            selectedIngredientTags={selectedIngredientTags}
            selectedIngredients={selectedIngredients}
            selectedRecipeTags={selectedMainRecipeTags}
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
          <div className={plannerPickerStyles.quickFilterRow} aria-label={t.filters.categories}>
            {browserMode === "recipes"
              ? quickRecipeFilters.map((tag) => (
                  <button
                    className={plannerPickerStyles.quickFilterChip(selectedMainRecipeTags.includes(tag))}
                    key={tag}
                    type="button"
                    onClick={() => toggleTagFilter(tag, setSelectedMainRecipeTags)}
                  >
                    {t.enums.recipeTags[tag] ?? t.enums.ingredientTags[tag] ?? tag}
                  </button>
                ))
              : quickIngredientFilters.map((tag) => (
                  <button
                    className={plannerPickerStyles.quickFilterChip(selectedIngredientTags.includes(tag))}
                    key={tag}
                    type="button"
                    onClick={() => toggleTagFilter(tag, setSelectedIngredientTags)}
                  >
                    {t.enums.ingredientTags[tag] ?? tag}
                  </button>
                ))}
          </div>
        </div>
        {isCategoryFilterOpen && (
          <Modal
            backdropClassName={recipeBrowserStyles.categoryFilterBackdrop}
            bodyClassName={recipeBrowserStyles.categoryFilterBody}
            closeButtonClassName={recipeBrowserStyles.modalCloseButton}
            closeLabel={t.common.close}
            headerClassName={recipeBrowserStyles.categoryFilterHeader}
            panelClassName={recipeBrowserStyles.categoryFilterPanel}
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
              defaultToppingTagName={toppingTagName}
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
          <p className={plannerPickerStyles.statusErrorWithOffset()}>{saveError}</p>
        )}

    </Modal>
  );
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
