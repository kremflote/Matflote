import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import IngredientThumbnail from "../IngredientThumbnail";
import RecipeThumbnail from "../RecipeThumbnail";
import { useCuisines, useIngredients, useRecipes } from "../../contexts";
import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { ICuisine } from "../../interfaces/ILookup";
import type { RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import BrowserDetailModal from "./BrowserDetailModal";
import BrowserFilterSection from "./BrowserFilterSection";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserDetail, BrowserMode, EnrichedRecipe } from "./types";

type BrowserProps = {
  mode: BrowserMode;
  theme: SiteTheme;
  headerActions: ReactNode;
};

function Browser({ mode, theme, headerActions }: BrowserProps) {
  const { cuisines } = useCuisines();
  const { recipes, recipeIsLoading, initError: recipeError } = useRecipes();
  const {
    ingredients,
    ingredientIsLoading,
    initError: ingredientError,
  } = useIngredients();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIngredientTags, setSelectedIngredientTags] = useState<IngredientTag[]>([]);
  const [selectedRecipeTypes, setSelectedRecipeTypes] = useState<RecipeType[]>([]);
  const [selectedRecipeTags, setSelectedRecipeTags] = useState<RecipeTag[]>([]);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<number[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<BrowserDetail | null>(null);
  const [ingredientPickerSearch, setIngredientPickerSearch] = useState("");
  const [ingredientPickerPosition, setIngredientPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const ingredientFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const ingredientPickerRef = useRef<HTMLDivElement | null>(null);

  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) =>
        matchesRecipeSearch(recipe, searchTerm) &&
        matchesSelectedIngredients(recipe, selectedIngredientIds) &&
        matchesRecipeTypes(recipe, selectedRecipeTypes) &&
        matchesRecipeTags(recipe, selectedRecipeTags) &&
        matchesCuisines(recipe, selectedCuisineIds),
      ),
    [
      recipes,
      searchTerm,
      selectedIngredientIds,
      selectedRecipeTypes,
      selectedRecipeTags,
      selectedCuisineIds,
    ],
  );

  const filteredIngredients = useMemo(
    () =>
      ingredients.filter((ingredient) =>
        matchesIngredientSearch(ingredient, searchTerm) &&
        matchesIngredientTags(ingredient, selectedIngredientTags),
      ),
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

  const clearFilters = () => {
    setSelectedIngredientTags([]);
    setSelectedRecipeTypes([]);
    setSelectedRecipeTags([]);
    setSelectedCuisineIds([]);
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

  return (
    <>
      <header>
        <div className={recipeBrowserStyles.headerControlsRow}>
          <div className={recipeBrowserStyles.headerTitle}>
            <h1 className={recipeBrowserStyles.title(theme)}>
              {mode === "recipes" ? "All Recipes" : "All Ingredients"}
            </h1>
          </div>
          <div className={recipeBrowserStyles.headerActions}>
            {headerActions}
          </div>
        </div>
        <div className={recipeBrowserStyles.searchFilterRow}>
          <div className={recipeBrowserStyles.searchControls}>
            <input
              aria-label={mode === "recipes" ? "Search recipes" : "Search ingredients"}
              className={recipeBrowserStyles.searchInput(theme)}
              placeholder="search..."
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className={recipeBrowserStyles.filterButtonSlot}>
              {mode === "recipes" && (
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
              )}
            </div>
          </div>
          <ActiveFilterChips
            mode={mode}
            cuisines={cuisines}
            selectedCuisineIds={selectedCuisineIds}
            selectedRecipeTags={selectedRecipeTags}
            selectedIngredientTags={selectedIngredientTags}
            selectedIngredients={selectedIngredients}
            selectedRecipeTypes={selectedRecipeTypes}
            theme={theme}
            onClear={clearFilters}
            onRemoveCuisine={(value) =>
              setSelectedCuisineIds((currentValues) => currentValues.filter((currentValue) => currentValue !== value))
            }
            onRemoveRecipeTag={(value) =>
              setSelectedRecipeTags((currentValues) => currentValues.filter((currentValue) => currentValue !== value))
            }
            onRemoveIngredient={(ingredientId) =>
              setSelectedIngredientIds((currentIds) =>
                currentIds.filter((currentId) => currentId !== ingredientId),
              )
            }
            onRemoveIngredientTag={(value) =>
              setSelectedIngredientTags((currentValues) =>
                currentValues.filter((currentValue) => currentValue !== value),
              )
            }
            onRemoveRecipeType={(value) =>
              setSelectedRecipeTypes((currentValues) => currentValues.filter((currentValue) => currentValue !== value))
            }
          />
        </div>
        {mode === "recipes" && ingredientPickerPosition !== null && (
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
      </header>

      <section className={recipeBrowserStyles.browserBodyGrid}>
        <BrowserFilterSection
          mode={mode}
          cuisines={cuisines}
          selectedCuisineIds={selectedCuisineIds}
          selectedRecipeTags={selectedRecipeTags}
          selectedIngredientTags={selectedIngredientTags}
          selectedRecipeTypes={selectedRecipeTypes}
          setSelectedCuisineIds={setSelectedCuisineIds}
          setSelectedRecipeTags={setSelectedRecipeTags}
          setSelectedIngredientTags={setSelectedIngredientTags}
          setSelectedRecipeTypes={setSelectedRecipeTypes}
          theme={theme}
        />

        <div className={recipeBrowserStyles.resultsWithFilters}>
          {mode === "ingredients" ? (
            ingredientIsLoading ? (
              <EmptyState theme={theme} title="Loading ingredients" body="Fetching the pantry." />
            ) : ingredientError !== null ? (
              <EmptyState theme={theme} title="Could not load ingredients" body={ingredientError} />
            ) : filteredIngredients.length === 0 ? (
              <EmptyState theme={theme} title="No ingredients found" body="Try changing search or filters." />
            ) : (
              <div className={recipeBrowserStyles.ingredientGrid}>
                {filteredIngredients.map((ingredient) => (
                  <IngredientThumbnail
                    ingredient={ingredient}
                    key={ingredient.ingredientId}
                    theme={theme}
                    onClick={() => setSelectedDetail({ kind: "ingredient", ingredient })}
                  />
                ))}
              </div>
            )
          ) : recipeIsLoading ? (
            <EmptyState theme={theme} title="Loading recipes" body="Fetching the cookbook." />
          ) : recipeError !== null ? (
            <EmptyState theme={theme} title="Could not load recipes" body={recipeError} />
          ) : filteredRecipes.length === 0 ? (
            <EmptyState theme={theme} title="No recipes found" body="Try changing search or filters." />
          ) : (
            <div className={recipeBrowserStyles.recipeGrid}>
              {filteredRecipes.map((recipe) => (
                <RecipeThumbnail
                  className={recipeBrowserStyles.recipeCard(theme)}
                  key={recipe.recipeId}
                  theme={theme}
                  recipe={{
                    imageUrl: recipe.imageUrl,
                    name: recipe.name,
                    subtitle: recipe.cuisine?.name ?? recipe.recipeType,
                  }}
                  onClick={() => setSelectedDetail({ kind: "recipe", recipe })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedDetail !== null && (
        <BrowserDetailModal
          detail={selectedDetail}
          theme={theme}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </>
  );
}

type ActiveFilterChipsProps = {
  mode: BrowserMode;
  cuisines: ICuisine[];
  selectedIngredientTags: IngredientTag[];
  selectedRecipeTypes: RecipeType[];
  selectedRecipeTags: RecipeTag[];
  selectedCuisineIds: number[];
  selectedIngredients: IIngredient[];
  theme: SiteTheme;
  onClear: () => void;
  onRemoveIngredientTag: (value: IngredientTag) => void;
  onRemoveRecipeType: (value: RecipeType) => void;
  onRemoveRecipeTag: (value: RecipeTag) => void;
  onRemoveCuisine: (value: number) => void;
  onRemoveIngredient: (ingredientId: number) => void;
};

function ActiveFilterChips({
  mode,
  cuisines,
  selectedIngredientTags,
  selectedRecipeTypes,
  selectedRecipeTags,
  selectedCuisineIds,
  selectedIngredients,
  theme,
  onClear,
  onRemoveIngredientTag,
  onRemoveRecipeType,
  onRemoveRecipeTag,
  onRemoveCuisine,
  onRemoveIngredient,
}: ActiveFilterChipsProps) {
  const hasIngredientFilters = selectedIngredientTags.length > 0;
  const hasRecipeFilters =
    selectedIngredients.length > 0 ||
    selectedRecipeTypes.length > 0 ||
    selectedRecipeTags.length > 0 ||
    selectedCuisineIds.length > 0;

  const hasVisibleFilters = mode === "ingredients" ? hasIngredientFilters : hasRecipeFilters;

  return (
    <div className={recipeBrowserStyles.activeFilterChips(mode)}>
      {!hasVisibleFilters && <span className={recipeBrowserStyles.emptyFilterChipSlot} aria-hidden="true" />}
      {mode === "ingredients" &&
        selectedIngredientTags.map((tag) => (
          <FilterChip
            key={tag}
            label={formatLabel(tag)}
            theme={theme}
            onClick={() => onRemoveIngredientTag(tag)}
          />
        ))}
      {mode === "recipes" &&
        selectedIngredients.map((ingredient) => (
          <FilterChip
            key={`ingredient-${ingredient.ingredientId}`}
            label={`includes: ${ingredient.ingredientName}`}
            theme={theme}
            onClick={() => onRemoveIngredient(ingredient.ingredientId)}
          />
        ))}
      {mode === "recipes" &&
        selectedRecipeTypes.map((type) => (
          <FilterChip
            key={type}
            label={formatLabel(type)}
            theme={theme}
            onClick={() => onRemoveRecipeType(type)}
          />
        ))}
      {mode === "recipes" &&
        selectedRecipeTags.map((tag) => (
          <FilterChip
            key={tag}
            label={formatLabel(tag)}
            theme={theme}
            onClick={() => onRemoveRecipeTag(tag)}
          />
        ))}
      {mode === "recipes" &&
        selectedCuisineIds.map((cuisineId) => (
          <FilterChip
            key={cuisineId}
            label={cuisines.find((cuisine) => cuisine.cuisineId === cuisineId)?.name ?? "Cuisine"}
            theme={theme}
            onClick={() => onRemoveCuisine(cuisineId)}
          />
        ))}
      {hasVisibleFilters && (
        <button className={recipeBrowserStyles.clearFilterChip(theme)} type="button" onClick={onClear}>
          Clear filters
        </button>
      )}
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

type EmptyStateProps = {
  title: string;
  body: string;
  theme: SiteTheme;
};

function EmptyState({ title, body, theme }: EmptyStateProps) {
  return (
    <div className={recipeBrowserStyles.emptyState(theme)}>
      <h2 className={recipeBrowserStyles.emptyStateTitle}>{title}</h2>
      <p className={recipeBrowserStyles.emptyStateBody}>{body}</p>
    </div>
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

function matchesRecipeSearch(recipe: EnrichedRecipe, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  const searchableText = [
    recipe.name,
    recipe.description,
    recipe.instructions,
    recipe.recipeType,
    recipe.cuisine?.name,
    ...recipe.tags,
    ...recipe.ingredients.map((recipeIngredient) => recipeIngredient.ingredient.ingredientName),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

function matchesIngredientSearch(ingredient: IIngredient, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  const searchableText = [
    ingredient.ingredientName,
    ...ingredient.tags,
    ingredient.brand?.name,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

function matchesSelectedIngredients(recipe: EnrichedRecipe, selectedIngredientIds: number[]) {
  if (selectedIngredientIds.length === 0) {
    return true;
  }

  return recipe.ingredients.some((recipeIngredient) =>
    selectedIngredientIds.includes(recipeIngredient.ingredient.ingredientId),
  );
}

function matchesRecipeTypes(recipe: EnrichedRecipe, selectedRecipeTypes: RecipeType[]) {
  if (selectedRecipeTypes.length === 0) {
    return true;
  }

  return selectedRecipeTypes.includes(recipe.recipeType);
}

function matchesRecipeTags(recipe: EnrichedRecipe, selectedRecipeTags: RecipeTag[]) {
  if (selectedRecipeTags.length === 0) {
    return true;
  }

  return recipe.tags.some((tag) => selectedRecipeTags.includes(tag));
}

function matchesCuisines(recipe: EnrichedRecipe, selectedCuisineIds: number[]) {
  if (selectedCuisineIds.length === 0) {
    return true;
  }

  return recipe.cuisineId !== null && selectedCuisineIds.includes(recipe.cuisineId);
}

function matchesIngredientTags(
  ingredient: IIngredient,
  selectedIngredientTags: IngredientTag[],
) {
  if (selectedIngredientTags.length === 0) {
    return true;
  }

  return ingredient.tags.some((tag) => selectedIngredientTags.includes(normalizeIngredientTag(tag)));
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
];

export default Browser;
