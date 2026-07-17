import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCuisines, useIngredients, useLanguage, useRecipes } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import Modal from "../Modal";
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
  modeToggle: ReactNode;
};

function Browser({ mode, theme, headerActions, modeToggle }: BrowserProps) {
  const { t } = useLanguage();
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
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
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

  useEffect(() => {
    if (!isCategoryFilterOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsCategoryFilterOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCategoryFilterOpen]);

  return (
    <>
      <header>
        <div className={recipeBrowserStyles.headerControlsRow}>
          <div className={recipeBrowserStyles.headerModeToggleStackedSlot}>
            {modeToggle}
          </div>
          <div className={recipeBrowserStyles.headerTitle}>
            <h1 className={recipeBrowserStyles.title(theme)}>
              {mode === "recipes" ? t.cookbook.allRecipes : t.cookbook.allIngredients}
            </h1>
          </div>
          <div className={recipeBrowserStyles.headerActions}>
            {headerActions}
            <div className={recipeBrowserStyles.headerModeToggleSlot}>
              {modeToggle}
            </div>
          </div>
        </div>
        <div className={recipeBrowserStyles.searchFilterRow}>
          <div className={recipeBrowserStyles.searchControls}>
            <div className={recipeBrowserStyles.searchFieldShell}>
              <input
                aria-label={mode === "recipes" ? t.browser.searchRecipes : t.browser.searchIngredients}
                className={`${recipeBrowserStyles.searchInput(theme)} ${recipeBrowserStyles.searchInputWithClear}`}
                placeholder={t.common.search}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              {searchTerm.length > 0 && (
                <button
                  aria-label={t.common.clear}
                  className={recipeBrowserStyles.searchClearButton(theme)}
                  type="button"
                  onClick={() => setSearchTerm("")}
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.25"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className={recipeBrowserStyles.filterButtonSlot}>
              <button
                aria-label={t.filters.categories}
                className={recipeBrowserStyles.categoryFilterButton(theme)}
                type="button"
                onClick={() => setIsCategoryFilterOpen(true)}
              >
                <CategoryIcon />
              </button>
              {mode === "recipes" && (
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
          titleId="cookbook-category-filter-title"
          onClose={() => setIsCategoryFilterOpen(false)}
        >
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
            variant="panel"
          />
        </Modal>
      )}

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

      <div className={recipeBrowserStyles.mobileModeToggleDock}>
        <div className={recipeBrowserStyles.mobileModeToggleInner}>
          {modeToggle}
        </div>
      </div>

      {selectedDetail !== null && (
        <BrowserDetailModal
          detail={selectedDetail}
          theme={theme}
          onClose={() => selectDetail(null)}
        />
      )}
    </>
  );
}

function CategoryIcon() {
  return (
    <svg className={recipeBrowserStyles.filterIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 5.5h7v7H4v-7Zm9 0h7v7h-7v-7Zm-9 9h7v4H4v-4Zm9 0h7v4h-7v-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Browser;
