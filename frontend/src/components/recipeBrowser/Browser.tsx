import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useIngredients, useLanguage, useRecipes } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag } from "../../interfaces/IRecipe";
import Modal from "../Modal";
import ActiveFilterChips from "./ActiveFilterChips";
import BrowserDetailModal from "./BrowserDetailModal";
import BrowserFilterSection from "./BrowserFilterSection";
import BrowserResults from "./BrowserResults";
import {
  matchesIngredientSearch,
  matchesIngredientTags,
  matchesRecipeSearch,
  matchesRecipeTags,
  matchesSelectedIngredients,
} from "./browserFilterUtils";
import IngredientPickerPopover, { FilterIcon } from "./IngredientFilterPopover";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import { useRouteDetail } from "../../utils/hashRoute";
import { toBrowserDetailKey, type BrowserDetail, type BrowserMode } from "./types";

type BrowserProps = {
  mode: BrowserMode;
  headerActions: ReactNode;
  modeToggle: ReactNode;
};

function Browser({ mode, headerActions, modeToggle }: BrowserProps) {
  const { t } = useLanguage();
  const { recipes, recipeIsLoading, initError: recipeError, refreshRecipes } = useRecipes();
  const {
    ingredients,
    ingredientIsLoading,
    initError: ingredientError,
    refreshIngredients,
  } = useIngredients();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIngredientTags, setSelectedIngredientTags] = useState<IngredientTag[]>([]);
  const [selectedRecipeTags, setSelectedRecipeTags] = useState<RecipeTag[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  // The open recipe or ingredient is part of the address (#/cookbook/recipe/12), so Back closes it.
  const { detail: selectedDetailKey, openDetail, closeDetail } = useRouteDetail("cookbook");
  const [ingredientPickerSearch, setIngredientPickerSearch] = useState("");
  const [ingredientPickerPosition, setIngredientPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const ingredientFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const ingredientPickerRef = useRef<HTMLDivElement | null>(null);

  const recipesById = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.recipeId, recipe])),
    [recipes],
  );
  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) =>
        matchesRecipeSearch(recipe, searchTerm) &&
        matchesSelectedIngredients(recipe, selectedIngredientIds, recipesById) &&
        matchesRecipeTags(recipe, selectedRecipeTags, recipesById),
      ),
    [
      recipes,
      recipesById,
      searchTerm,
      selectedIngredientIds,
      selectedRecipeTags,
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

  const selectDetail = (detail: BrowserDetail | null) => {
    if (detail === null) {
      closeDetail();
      return;
    }

    openDetail(toBrowserDetailKey(detail));
  };

  const clearFilters = () => {
    setSelectedIngredientTags([]);
    setSelectedRecipeTags([]);
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
      <header className={recipeBrowserStyles.browserHeader}>
        <div className={recipeBrowserStyles.headerControlsRow}>
          <div className={recipeBrowserStyles.headerModeToggleStackedSlot}>
            {modeToggle}
          </div>
          <div className={recipeBrowserStyles.headerTitle}>
            <h1 className={recipeBrowserStyles.title}>
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
                className={`${recipeBrowserStyles.searchInput} ${recipeBrowserStyles.searchInputWithClear}`}
                placeholder={t.common.search}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              {searchTerm.length > 0 && (
                <button
                  aria-label={t.common.clear}
                  className={recipeBrowserStyles.searchClearButton}
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
                className={recipeBrowserStyles.categoryFilterButton}
                type="button"
                onClick={() => setIsCategoryFilterOpen(true)}
              >
                <CategoryIcon />
              </button>
              {mode === "recipes" && (
                <button
                  aria-label={t.browser.openIngredientFilter}
                  className={recipeBrowserStyles.filterButton}
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
            </div>
          </div>
          <ActiveFilterChips
            mode={mode}
            selectedRecipeTags={selectedRecipeTags}
            selectedIngredientTags={selectedIngredientTags}
            selectedIngredients={selectedIngredients}
            onClear={clearFilters}
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
          />
        </div>
        {mode === "recipes" && ingredientPickerPosition !== null && (
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
      </header>

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
          titleId="cookbook-category-filter-title"
          onClose={() => setIsCategoryFilterOpen(false)}
        >
          <BrowserFilterSection
            mode={mode}
            selectedRecipeTags={selectedRecipeTags}
            selectedIngredientTags={selectedIngredientTags}
            setSelectedRecipeTags={setSelectedRecipeTags}
            setSelectedIngredientTags={setSelectedIngredientTags}
            variant="panel"
          />
        </Modal>
      )}

      <section className={recipeBrowserStyles.browserBodyGrid}>
        <BrowserFilterSection
          mode={mode}
          selectedRecipeTags={selectedRecipeTags}
          selectedIngredientTags={selectedIngredientTags}
          setSelectedRecipeTags={setSelectedRecipeTags}
          setSelectedIngredientTags={setSelectedIngredientTags}
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
            onRetryIngredients={refreshIngredients}
            onRetryRecipes={refreshRecipes}
            onSelectDetail={selectDetail}
          />
        </div>
      </section>

      {selectedDetailKey !== null && (
        <BrowserDetailModal
          detail={selectedDetailKey}
          key={`${selectedDetailKey.kind}-${selectedDetailKey.id}`}
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
