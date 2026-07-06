import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useCuisines, useIngredients } from "../contexts";
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
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
    searchInputRef.current?.focus();
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
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmingRemove, onClose]);

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
      setSaveError("Could not remove this meal. Please try again.");
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
      setSaveError("Could not save this meal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={plannerPickerStyles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={plannerPickerStyles.modalPanel(theme)}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={plannerPickerStyles.header}>
          <div>
            <h2 className={plannerPickerStyles.title} id={titleId}>
              {phase === "main" ? "Choose main dish" : "Choose supplements"}
            </h2>
            <p className={plannerPickerStyles.subtitle(theme)}>
              {phase === "main"
                ? "Select one dish for this meal slot."
                : "Add up to six sides, sauces, dips, spice mixes, or salads."}
            </p>
          </div>
          <button className={plannerPickerStyles.closeButton(theme)} type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className={plannerPickerStyles.controls}>
          <input
            aria-label="Search recipes"
            className={plannerPickerStyles.searchInput(theme)}
            placeholder="search recipes..."
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button
            aria-label="Open ingredient filter"
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
          <span className={plannerPickerStyles.phaseBadge(theme)}>
            {phase === "main"
              ? "Dish"
              : `${supplementaryRecipeIds.length}/${maxSupplementaryRecipes} selected`}
          </span>
        </div>
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
          <aside className={plannerPickerStyles.filterRail(theme)} aria-label="Recipe filters">
            {phase === "main" ? (
              <>
                <FilterGroup
                  disabledValues={mainProteinFilters.filter(
                    (filter) => !availableMainProteinTags.has(filter),
                  )}
                  selectedValues={selectedMainProteinTags}
                  theme={theme}
                  title="Protein"
                  values={mainProteinFilters}
                  onToggle={(value) => toggleSelection(value, setSelectedMainProteinTags)}
                />
                <FilterGroup
                  disabledValues={recipeTags.filter(
                    (filter) => !availableMainRecipeTags.has(filter),
                  )}
                  selectedValues={selectedMainRecipeTags}
                  theme={theme}
                  title="Tags"
                  values={recipeTags}
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
                title="Type"
                values={supplementaryFilters}
                onToggle={(value) => toggleSelection(value, setSelectedSupplementaryFilters)}
              />
            )}
            {cuisines.length > 0 && (
              <NumberFilterGroup
                selectedValues={selectedCuisineIds}
                theme={theme}
                title="Cuisine"
                values={cuisineOptions}
                onToggle={(value) => toggleSelection(value, setSelectedCuisineIds)}
              />
            )}
          </aside>

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
          <p className={`${plannerPickerStyles.statusError(theme)} mt-4`}>{saveError}</p>
        )}

        <div className={plannerPickerStyles.footer}>
          <button
            className={plannerPickerStyles.secondaryButton(theme)}
            disabled={isSaving || isRemoving}
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          {phase === "main" ? (
            <button
              className={plannerPickerStyles.primaryButton(theme)}
              disabled={mainRecipeId === null || isSaving || isRemoving}
              type="button"
              onClick={confirmHighlightedMainRecipe}
            >
              Choose sides
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
              Back
            </button>
          )}
          {entry !== undefined && (
            <button
              className={plannerPickerStyles.removeButton(theme)}
              disabled={isSaving || isRemoving}
              type="button"
              onClick={() => setIsConfirmingRemove(true)}
            >
              {isRemoving ? "Removing..." : "Remove meal"}
            </button>
          )}
          <button
            className={plannerPickerStyles.primaryButton(theme)}
            disabled={mainRecipe === null || isSaving || isRemoving}
            type="button"
            onClick={saveMealSlot}
          >
            {isSaving ? "Saving..." : "Save meal"}
          </button>
        </div>
        {isConfirmingRemove && (
          <ConfirmationDialog
            body="This will clear the meal slot."
            confirmLabel="Remove"
            isBusy={isRemoving}
            theme={theme}
            title="Remove this meal?"
            onCancel={() => setIsConfirmingRemove(false)}
            onConfirm={() => void removeMealSlot()}
          />
        )}
      </section>
    </div>
  );
}

export default PlannerRecipePickerModal;
