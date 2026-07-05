import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { useCuisines, useIngredients } from "../contexts";
import type { IIngredient, IngredientTag } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealRecipeRole, MealSlot } from "../interfaces/IMeal";
import type { IRecipe, RecipeTag, RecipeType } from "../interfaces/IRecipe";
import type { MealPlanEntryRequest } from "../services/mealPlanService";
import { plannerPickerStyles, type SiteTheme } from "../styles/appStyles";
import IngredientThumbnail from "./IngredientThumbnail";
import { ingredientTags, recipeTags, recipeTypes } from "./recipeBrowser/formOptions";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowser/recipeBrowserStyles";
import RecipeThumbnail from "./RecipeThumbnail";

type PickerPhase = "main" | "supplements";
type SupplementaryFilter = RecipeType | RecipeTag;

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

const mainRecipeTypes: RecipeType[] = recipeTypes.filter((recipeType) => recipeType === "Dish");
const supplementaryRecipeTypeFilters: RecipeType[] = recipeTypes.filter(
  (recipeType) =>
    recipeType === "Side" ||
    recipeType === "Sauce" ||
    recipeType === "Dip" ||
    recipeType === "SpiceMix",
);
const supplementaryRecipeTagFilters: RecipeTag[] = recipeTags.filter((recipeTag) => recipeTag === "Salad");
const supplementaryFilters: SupplementaryFilter[] = [
  ...supplementaryRecipeTypeFilters,
  ...supplementaryRecipeTagFilters,
];
const excludedSupplementaryTags: RecipeTag[] = recipeTags.filter(
  (recipeTag) => recipeTag === "Breakfast" || recipeTag === "Dinner",
);
const mainProteinFilters: IngredientTag[] = ingredientTags.filter(
  (ingredientTag) =>
    ingredientTag === "Chicken" ||
    ingredientTag === "Fish" ||
    ingredientTag === "Beef" ||
    ingredientTag === "Lamb" ||
    ingredientTag === "Mince",
);
const maxSupplementaryRecipes = 6;

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
  const [phase, setPhase] = useState<PickerPhase>(initialMainRecipeId === null ? "main" : "supplements");
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const ingredientFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const ingredientPickerRef = useRef<HTMLDivElement | null>(null);

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

  const highlightMainRecipe = (recipe: IRecipe) => {
    setHighlightedMainRecipeId((currentRecipeId) => {
      if (currentRecipeId !== recipe.recipeId) {
        return recipe.recipeId;
      }

      if (mainRecipeId === recipe.recipeId) {
        setMainRecipeId(null);
        setSupplementaryRecipeIds([]);
      }

      return null;
    });
  };

  const confirmHighlightedMainRecipe = () => {
    if (highlightedMainRecipeId === null) {
      return;
    }

    setMainRecipeId(highlightedMainRecipeId);
    setPhase("supplements");
    setSearchTerm("");
  };

  const clearIngredientFilters = () => {
    setSelectedIngredientIds([]);
  };

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

  const saveMealSlot = async () => {
    if (mainRecipe === null) {
      if (entry !== undefined) {
        setIsSaving(true);
        setSaveError(null);

        try {
          await onDelete(entry.mealPlanEntryId);
          onClose();
        } catch {
          setSaveError("Could not remove this meal. Please try again.");
        } finally {
          setIsSaving(false);
        }
      }

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
    <div className={plannerPickerStyles.modalBackdrop} role="presentation">
      <section
        aria-modal="true"
        className={plannerPickerStyles.modalPanel(theme)}
        role="dialog"
      >
        <div className={plannerPickerStyles.header}>
          <div>
            <h2 className={plannerPickerStyles.title}>
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
            onClear={clearIngredientFilters}
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

          <RecipePickerGrid
            highlightedMainRecipeId={highlightedMainRecipeId}
            phase={phase}
            recipes={visibleRecipes}
            supplementaryRecipeIds={supplementaryRecipeIds}
            theme={theme}
            onSelectMainRecipe={highlightMainRecipe}
            onToggleSupplementaryRecipe={toggleSupplementaryRecipe}
          />
        </div>

        {(mainRecipe !== null || supplementaryRecipes.length > 0) && (
          <section className={`${plannerPickerStyles.selectedSection} ${plannerPickerStyles.selectedSectionBorder(theme)}`}>
            {mainRecipe !== null && (
              <div className={plannerPickerStyles.selectedMainGrid}>
                <RecipeThumbnail
                  className={plannerPickerStyles.selectedMainThumbnail}
                  recipe={{
                    imageUrl: mainRecipe.imageUrl,
                    name: mainRecipe.name,
                    subtitle: mainRecipe.cuisine?.name ?? mainRecipe.recipeType,
                  }}
                  theme={theme}
                />
                {supplementaryRecipes.length > 0 && (
                  <div className={plannerPickerStyles.selectedStrip}>
                    {supplementaryRecipes.map((recipe) => (
                      <button
                        className={plannerPickerStyles.selectedItem(theme)}
                        key={recipe.recipeId}
                        type="button"
                        onClick={() => toggleSupplementaryRecipe(recipe)}
                      >
                        {recipe.name} x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {mainRecipe === null && supplementaryRecipes.length > 0 && (
              <div className={plannerPickerStyles.selectedStrip}>
                {supplementaryRecipes.map((recipe) => (
                  <button
                    className={plannerPickerStyles.selectedItem(theme)}
                    key={recipe.recipeId}
                    type="button"
                    onClick={() => toggleSupplementaryRecipe(recipe)}
                  >
                    {recipe.name} x
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {saveError !== null && (
          <p className={`${plannerPickerStyles.statusError(theme)} mt-4`}>{saveError}</p>
        )}

        <div className={plannerPickerStyles.footer}>
          {phase === "main" ? (
            <button
              className={plannerPickerStyles.primaryButton(theme)}
              disabled={highlightedMainRecipeId === null}
              type="button"
              onClick={confirmHighlightedMainRecipe}
            >
              Choose sides
            </button>
          ) : (
            <button
              className={plannerPickerStyles.secondaryButton(theme)}
              type="button"
              onClick={() => {
                setHighlightedMainRecipeId(mainRecipeId);
                setPhase("main");
              }}
            >
              Back
            </button>
          )}
          <button
            className={plannerPickerStyles.secondaryButton(theme)}
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={plannerPickerStyles.primaryButton(theme)}
            disabled={(mainRecipe === null && entry === undefined) || isSaving}
            type="button"
            onClick={saveMealSlot}
          >
            Save meal
          </button>
        </div>
      </section>
    </div>
  );
}

type RecipePickerGridProps = {
  highlightedMainRecipeId: number | null;
  phase: PickerPhase;
  recipes: IRecipe[];
  supplementaryRecipeIds: number[];
  theme: SiteTheme;
  onSelectMainRecipe: (recipe: IRecipe) => void;
  onToggleSupplementaryRecipe: (recipe: IRecipe) => void;
};

function RecipePickerGrid({
  highlightedMainRecipeId,
  phase,
  recipes,
  supplementaryRecipeIds,
  theme,
  onSelectMainRecipe,
  onToggleSupplementaryRecipe,
}: RecipePickerGridProps) {
  if (recipes.length === 0) {
    return (
      <div className={plannerPickerStyles.emptyState(theme)}>No matching recipes found.</div>
    );
  }

  return (
    <div className={plannerPickerStyles.recipeGrid}>
      {recipes.map((recipe) => {
        const selected =
          phase === "main"
            ? recipe.recipeId === highlightedMainRecipeId
            : supplementaryRecipeIds.includes(recipe.recipeId);

        return (
          <RecipeThumbnail
            className={plannerPickerStyles.recipeCard(theme, selected)}
            key={recipe.recipeId}
            recipe={{
              imageUrl: recipe.imageUrl,
              name: recipe.name,
              subtitle: recipe.cuisine?.name ?? recipe.recipeType,
            }}
            interactiveEffect={false}
            theme={theme}
            onClick={() =>
              phase === "main"
                ? onSelectMainRecipe(recipe)
                : onToggleSupplementaryRecipe(recipe)
            }
          />
        );
      })}
    </div>
  );
}

type IngredientFilterChipsProps = {
  selectedIngredients: IIngredient[];
  theme: SiteTheme;
  onClear: () => void;
  onRemoveIngredient: (ingredientId: number) => void;
};

function IngredientFilterChips({
  selectedIngredients,
  theme,
  onClear,
  onRemoveIngredient,
}: IngredientFilterChipsProps) {
  if (selectedIngredients.length === 0) {
    return <span className={plannerPickerStyles.emptyIngredientChipSlot} aria-hidden="true" />;
  }

  return (
    <div className={plannerPickerStyles.ingredientFilterChips}>
      {selectedIngredients.map((ingredient) => (
        <FilterChip
          key={ingredient.ingredientId}
          label={`includes: ${ingredient.ingredientName}`}
          theme={theme}
          onClick={() => onRemoveIngredient(ingredient.ingredientId)}
        />
      ))}
      <button className={recipeBrowserStyles.clearFilterChip(theme)} type="button" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}

type FilterChipProps = {
  label: string;
  theme: SiteTheme;
  onClick: () => void;
};

function FilterChip({ label, theme, onClick }: FilterChipProps) {
  return (
    <button className={recipeBrowserStyles.filterChip(theme)} type="button" onClick={onClick}>
      {label}
      <span aria-hidden="true">x</span>
    </button>
  );
}

type IngredientPickerPopoverProps = {
  ingredients: IIngredient[];
  popoverRef: RefObject<HTMLDivElement | null>;
  searchTerm: string;
  selectedIngredientIds: number[];
  theme: SiteTheme;
  x: number;
  y: number;
  onSearchChange: (value: string) => void;
  onToggleIngredient: (ingredientId: number) => void;
};

function IngredientPickerPopover({
  ingredients,
  popoverRef,
  searchTerm,
  selectedIngredientIds,
  theme,
  x,
  y,
  onSearchChange,
  onToggleIngredient,
}: IngredientPickerPopoverProps) {
  return (
    <div
      className={recipeBrowserStyles.ingredientPicker(theme)}
      ref={popoverRef}
      style={{
        left: `min(${x}px, calc(100vw - 304px))`,
        top: `min(${y + 8}px, calc(100vh - 360px))`,
      }}
    >
      <input
        aria-label="Search ingredients to include"
        className={recipeBrowserStyles.ingredientPickerSearch(theme)}
        placeholder="search ingredient..."
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className={recipeBrowserStyles.ingredientPickerList}>
        {ingredients.length === 0 ? (
          <p className={recipeBrowserStyles.ingredientPickerEmpty(theme)}>No ingredients found</p>
        ) : (
          ingredients.map((ingredient) => (
            <IngredientThumbnail
              className={recipeBrowserStyles.ingredientPickerItem}
              ingredient={ingredient}
              key={ingredient.ingredientId}
              selected={selectedIngredientIds.includes(ingredient.ingredientId)}
              selectedPresentation="muted"
              theme={theme}
              onClick={() => onToggleIngredient(ingredient.ingredientId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg className={recipeBrowserStyles.filterIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5h16l-6.25 7.2v5.2l-3.5 1.9v-7.1L4 5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

type NumberFilterGroupProps = {
  title: string;
  values: readonly { disabled?: boolean; id: number; label: string }[];
  selectedValues: readonly number[];
  theme: SiteTheme;
  onToggle: (value: number) => void;
};

function NumberFilterGroup({
  title,
  values,
  selectedValues,
  theme,
  onToggle,
}: NumberFilterGroupProps) {
  return (
    <fieldset className={recipeBrowserStyles.filterGroup(theme)}>
      <div className={recipeBrowserStyles.filterGroupHeader}>
        <legend className={recipeBrowserStyles.filterLegend(theme)}>{title}</legend>
      </div>
      <div className={recipeBrowserStyles.filterOptionList}>
        {values.map((value) => (
          <label
            className={`${recipeBrowserStyles.checkboxLabel(theme)} ${
              value.disabled === true ? plannerPickerStyles.disabledFilterOption(theme) : ""
            }`}
            key={value.id}
          >
            <input
              checked={value.disabled === true ? false : selectedValues.includes(value.id)}
              className={recipeBrowserStyles.checkbox}
              disabled={value.disabled === true}
              type="checkbox"
              onChange={() => onToggle(value.id)}
            />
            {value.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type FilterGroupProps<TValue extends string> = {
  title: string;
  disabledValues?: readonly TValue[];
  values: readonly TValue[];
  selectedValues: readonly TValue[];
  theme: SiteTheme;
  onToggle: (value: TValue) => void;
};

function FilterGroup<TValue extends string>({
  title,
  disabledValues = [],
  values,
  selectedValues,
  theme,
  onToggle,
}: FilterGroupProps<TValue>) {
  return (
    <fieldset className={recipeBrowserStyles.filterGroup(theme)}>
      <div className={recipeBrowserStyles.filterGroupHeader}>
        <legend className={recipeBrowserStyles.filterLegend(theme)}>{title}</legend>
      </div>
      <div className={recipeBrowserStyles.filterOptionList}>
        {values.map((value) => {
          const disabled = disabledValues.includes(value);

          return (
            <label
              className={`${recipeBrowserStyles.checkboxLabel(theme)} ${
                disabled ? plannerPickerStyles.disabledFilterOption(theme) : ""
              }`}
              key={value}
            >
              <input
                checked={disabled ? false : selectedValues.includes(value)}
                className={recipeBrowserStyles.checkbox}
                disabled={disabled}
                type="checkbox"
                onChange={() => onToggle(value)}
              />
              {formatLabel(value)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function toggleSelection<TValue extends string | number>(
  value: TValue,
  setSelectedValues: Dispatch<SetStateAction<TValue[]>>,
) {
  setSelectedValues((selectedValues) =>
    selectedValues.includes(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value],
  );
}

function isMainDish(recipe: IRecipe) {
  return mainRecipeTypes.includes(recipe.recipeType);
}

function isSupplementaryRecipe(recipe: IRecipe, selectedFilters: SupplementaryFilter[]) {
  const matchesRecipeType =
    supplementaryRecipeTypeFilters.includes(recipe.recipeType) &&
    selectedFilters.includes(recipe.recipeType);
  const matchesRecipeTag = supplementaryRecipeTagFilters.some(
    (recipeTag) => selectedFilters.includes(recipeTag) && recipe.tags.includes(recipeTag),
  );

  return (
    (matchesRecipeType || matchesRecipeTag) &&
    !excludedSupplementaryTags.some((tag) => recipe.tags.includes(tag))
  );
}

function matchesSelectedCuisines(recipe: IRecipe, selectedCuisineIds: number[]) {
  if (selectedCuisineIds.length === 0) {
    return true;
  }

  return recipe.cuisineId !== null && selectedCuisineIds.includes(recipe.cuisineId);
}

function matchesSelectedIngredients(recipe: IRecipe, selectedIngredientIds: number[]) {
  if (selectedIngredientIds.length === 0) {
    return true;
  }

  return recipe.ingredients.some((recipeIngredient) =>
    selectedIngredientIds.includes(recipeIngredient.ingredient.ingredientId),
  );
}

function matchesSelectedIngredientTags(recipe: IRecipe, selectedIngredientTags: IngredientTag[]) {
  if (selectedIngredientTags.length === 0) {
    return true;
  }

  return selectedIngredientTags.some((ingredientTag) => recipeHasIngredientTag(recipe, ingredientTag));
}

function matchesSelectedRecipeTags(recipe: IRecipe, selectedRecipeTags: RecipeTag[]) {
  if (selectedRecipeTags.length === 0) {
    return true;
  }

  return recipe.tags.some((recipeTag) => selectedRecipeTags.includes(recipeTag));
}

function matchesSearch(recipe: IRecipe, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  return [
    recipe.name,
    recipe.recipeType,
    recipe.cuisine?.name,
    ...recipe.tags,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function matchesIngredientSearch(ingredient: IIngredient, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  return [
    ingredient.ingredientName,
    ...ingredient.tags.map(normalizeIngredientTag),
    ingredient.brand?.name,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function recipeHasIngredientTag(recipe: IRecipe, ingredientTag: IngredientTag) {
  return recipe.ingredients.some((recipeIngredient) =>
    recipeIngredient.ingredient.tags
      .map(normalizeIngredientTag)
      .includes(ingredientTag),
  );
}

function normalizeIngredientTag(tag: IngredientTag | number | string): IngredientTag {
  if (typeof tag === "string" && ingredientTagByIndex.includes(tag as IngredientTag)) {
    return tag as IngredientTag;
  }

  if (typeof tag === "number" && ingredientTagByIndex[tag]) {
    return ingredientTagByIndex[tag];
  }

  return "Other";
}

function getSupplementaryRole(recipe: IRecipe): MealRecipeRole {
  if (recipe.recipeType === "Sauce" || recipe.recipeType === "Dip") {
    return "Sauce";
  }

  if (recipe.recipeType === "Side" || recipe.tags.includes("Salad")) {
    return "Side";
  }

  return "Extra";
}

const ingredientTagByIndex: IngredientTag[] = [
  "Vegetable",
  "Fruit",
  "Chicken",
  "Fish",
  "Beef",
  "Lamb",
  "Mince",
  "Dairy",
  "Grain",
  "Spice",
  "Herb",
  "Sauce",
  "Pantry",
  "Frozen",
  "Other",
  "LeafyGreen",
];

export default PlannerRecipePickerModal;
