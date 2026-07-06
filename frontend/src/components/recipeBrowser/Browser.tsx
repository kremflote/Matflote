import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCuisines, useIngredients, useRecipes } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import ActiveFilterChips from "./ActiveFilterChips";
import BrowserDetailModal from "./BrowserDetailModal";
import BrowserFilterSection from "./BrowserFilterSection";
import BrowserResults from "./BrowserResults";
import {
  matchesCuisines,
  matchesIngredientSearch,
  matchesIngredientTags,
  matchesRecipeSearch,
  matchesRecipeTags,
  matchesRecipeTypes,
  matchesSelectedIngredients,
} from "./browserFilterUtils";
import IngredientPickerPopover, { FilterIcon } from "./IngredientFilterPopover";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserDetail, BrowserMode } from "./types";

type BrowserDetailKey =
  | { id: number; kind: "ingredient" }
  | { id: number; kind: "recipe" };

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
  const [selectedDetailKey, setSelectedDetailKey] = useState<BrowserDetailKey | null>(null);
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

  const selectedDetail = useMemo<BrowserDetail | null>(() => {
    if (selectedDetailKey === null) {
      return null;
    }

    if (selectedDetailKey.kind === "recipe") {
      const recipe = recipes.find((item) => item.recipeId === selectedDetailKey.id);
      return recipe === undefined ? null : { kind: "recipe", recipe };
    }

    const ingredient = ingredients.find((item) => item.ingredientId === selectedDetailKey.id);
    return ingredient === undefined ? null : { kind: "ingredient", ingredient };
  }, [ingredients, recipes, selectedDetailKey]);

  const selectDetail = (detail: BrowserDetail | null) => {
    if (detail === null) {
      setSelectedDetailKey(null);
      return;
    }

    setSelectedDetailKey(
      detail.kind === "recipe"
        ? { kind: "recipe", id: detail.recipe.recipeId }
        : { kind: "ingredient", id: detail.ingredient.ingredientId },
    );
  };

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
          <BrowserResults
            filteredIngredients={filteredIngredients}
            filteredRecipes={filteredRecipes}
            ingredientError={ingredientError}
            ingredientIsLoading={ingredientIsLoading}
            mode={mode}
            recipeError={recipeError}
            recipeIsLoading={recipeIsLoading}
            theme={theme}
            onSelectDetail={selectDetail}
          />
        </div>
      </section>

      {selectedDetail !== null && (
        <BrowserDetailModal
          detail={selectedDetail}
          theme={theme}
          onClose={() => selectDetail(null)}
          onSelectDetail={selectDetail}
        />
      )}
    </>
  );
}

export default Browser;
