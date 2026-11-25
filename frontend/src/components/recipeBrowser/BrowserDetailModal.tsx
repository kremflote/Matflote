import { useId, useMemo, useState } from "react";
import ConfirmationDialog from "../ConfirmationDialog";
import { useIngredients, useLanguage, useMealPlan, useRecipes } from "../../contexts";
import type { IIngredient, IIngredientInUse } from "../../interfaces/IIngredient";
import type { IRecipe } from "../../interfaces/IRecipe";
import { getIngredientInUse, ingredientService, recipeService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import Modal from "../Modal";
import IngredientCreateForm from "./IngredientCreateForm";
import IngredientDetailContent from "./IngredientDetailContent";
import IngredientInUseDialog from "./IngredientInUseDialog";
import RecipeCreateForm from "./RecipeCreateForm";
import RecipeDetailContent from "./RecipeDetailContent";
import { recipeTags } from "./formOptions";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import { toBrowserDetailKey, type BrowserDetail, type BrowserDetailKey } from "./types";

type BrowserDetailModalProps = {
  /**
   * What to show, by id; the current recipe or ingredient is looked up in the lists, so a refresh
   * keeps an open edit form. Give the modal a `key` from this so opening another one starts afresh.
   */
  detail: BrowserDetailKey;
  theme: SiteTheme;
  onClose: () => void;
};

function BrowserDetailModal({ detail, theme, onClose }: BrowserDetailModalProps) {
  const { language, t } = useLanguage();
  const editRecipeImageInputId = useId();
  const editTitleId = useId();
  const detailTitleId = useId();
  const { recipes, refreshRecipes } = useRecipes();
  const { ingredients, refreshIngredients } = useIngredients();
  const { refreshMealPlan } = useMealPlan();
  const [activeKey, setActiveKey] = useState(detail);
  const [detailHistory, setDetailHistory] = useState<BrowserDetailKey[]>([]);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isEditingIngredient, setIsEditingIngredient] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [ingredientInUse, setIngredientInUse] = useState<IIngredientInUse | null>(null);
  const activeDetail = useMemo(
    () => resolveDetail(activeKey, recipes, ingredients),
    [activeKey, ingredients, recipes],
  );

  const navigateToDetail = (nextDetail: BrowserDetail) => {
    const nextKey = toBrowserDetailKey(nextDetail);
    if (isSameDetail(activeKey, nextKey)) {
      return;
    }

    setDetailHistory((currentHistory) => [...currentHistory, activeKey]);
    setActiveKey(nextKey);
    setIsEditingRecipe(false);
    setIsEditingIngredient(false);
    setDeleteError(null);
    setPdfError(null);
    setIsConfirmingDelete(false);
  };

  const navigateBack = () => {
    setDetailHistory((currentHistory) => {
      const previousDetail = currentHistory.at(-1);

      if (previousDetail === undefined) {
        return currentHistory;
      }

      setActiveKey(previousDetail);
      setIsEditingRecipe(false);
      setIsEditingIngredient(false);
      setDeleteError(null);
      setPdfError(null);
      setIsConfirmingDelete(false);
      return currentHistory.slice(0, -1);
    });
  };

  // Removed elsewhere, or not loaded: there is nothing to show.
  if (activeDetail === null) {
    return null;
  }

  const handleExportPdf = async () => {
    if (activeDetail.kind !== "recipe" || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);
    setPdfError(null);

    try {
      await recipeService.downloadPdf(activeDetail.recipe.recipeId, language);
    } catch (caughtError) {
      setPdfError(caughtError instanceof Error ? caughtError.message : t.cookbook.couldNotExportPdf);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleRemove = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (activeDetail.kind === "recipe") {
        await recipeService.delete(activeDetail.recipe.recipeId);
        await refreshRecipes();
      } else {
        await ingredientService.delete(activeDetail.ingredient.ingredientId);
        await refreshIngredients();
        await refreshRecipes();
      }

      onClose();
    } catch (caughtError) {
      const uses = getIngredientInUse(caughtError);
      if (uses !== null) {
        setIngredientInUse(uses);
        return;
      }

      setDeleteError(caughtError instanceof Error ? caughtError.message : activeDetail.kind === "recipe" ? t.cookbook.couldNotRemoveRecipe : t.cookbook.couldNotRemoveIngredient);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  if (activeDetail.kind === "recipe" && isEditingRecipe) {
    return (
      <Modal
        backdropClassName={recipeBrowserStyles.modalBackdrop}
        closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
        closeLabel={t.common.close}
        headerClassName={recipeBrowserStyles.modalHeader}
        panelClassName={recipeBrowserStyles.modalPanel(theme)}
        title={`${t.common.edit} ${activeDetail.recipe.name}`}
        titleClassName={recipeBrowserStyles.modalTitle}
        titleId={editTitleId}
        onClose={onClose}
      >
        <RecipeCreateForm
          imageInputId={editRecipeImageInputId}
          initialRecipe={activeDetail.recipe}
          showRecipeDetails
          theme={theme}
          onCancel={() => setIsEditingRecipe(false)}
          onCreated={onClose}
        />
      </Modal>
    );
  }

  if (activeDetail.kind === "ingredient" && isEditingIngredient) {
    return (
      <Modal
        backdropClassName={recipeBrowserStyles.modalBackdrop}
        closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
        closeLabel={t.common.close}
        headerClassName={recipeBrowserStyles.modalHeader}
        panelClassName={recipeBrowserStyles.modalPanel(theme)}
        title={`${t.common.edit} ${activeDetail.ingredient.ingredientName}`}
        titleClassName={recipeBrowserStyles.modalTitle}
        titleId={editTitleId}
        onClose={onClose}
      >
        <IngredientCreateForm
          initialIngredient={activeDetail.ingredient}
          theme={theme}
          onCancel={() => setIsEditingIngredient(false)}
          onCreated={onClose}
        />
      </Modal>
    );
  }

  const detailTitle =
    activeDetail.kind === "recipe" ? (
      <span className={recipeBrowserStyles.detailHeaderTitleRow}>
        <span>{activeDetail.recipe.name}</span>
        <span className={recipeBrowserStyles.detailHeaderTagList}>
          {activeDetail.recipe.tags
            .filter((tag) => recipeTags.includes(tag))
            .map((tag) => (
              <span className={recipeBrowserStyles.filterChip(theme)} key={tag}>
                {t.enums.recipeTags[tag] ?? tag}
              </span>
            ))}
        </span>
      </span>
    ) : (
      <span className={recipeBrowserStyles.detailHeaderTitleRow}>
        <span>{activeDetail.ingredient.ingredientName}</span>
        <span className={recipeBrowserStyles.detailHeaderTagList}>
          {activeDetail.ingredient.tags.map((tag) => (
            <span className={recipeBrowserStyles.filterChip(theme)} key={tag}>
              {t.enums.ingredientTags[tag] ?? tag}
            </span>
          ))}
        </span>
      </span>
    );

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.modalBackdrop}
      bodyClassName={recipeBrowserStyles.detailBodyScrollArea}
      closeButtonClassName={recipeBrowserStyles.detailCloseButton(theme)}
      closeLabel={t.common.close}
      footer={
        <>
          {detailHistory.length > 0 && (
            <button
              className={recipeBrowserStyles.detailHeaderBackButton(theme)}
              disabled={isDeleting}
              type="button"
              onClick={navigateBack}
            >
              {t.common.back}
            </button>
          )}
          {activeDetail.kind === "recipe" && (
            <button
              className={recipeBrowserStyles.detailHeaderEditButton(theme)}
              disabled={isExportingPdf || isDeleting}
              type="button"
              onClick={() => void handleExportPdf()}
            >
              {isExportingPdf ? t.cookbook.exportingPdf : t.cookbook.exportPdf}
            </button>
          )}
          <button
            className={recipeBrowserStyles.detailHeaderEditButton(theme)}
            type="button"
            onClick={() => {
              if (activeDetail.kind === "recipe") {
                setIsEditingRecipe(true);
              } else {
                setIsEditingIngredient(true);
              }
            }}
          >
            {t.common.edit}
          </button>
          <button
            className={recipeBrowserStyles.detailHeaderRemoveButton(theme)}
            disabled={isDeleting}
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
          >
            {isDeleting ? t.common.removing : t.common.remove}
          </button>
        </>
      }
      footerClassName={recipeBrowserStyles.detailHeaderActionRow}
      headerClassName={recipeBrowserStyles.detailFrameHeader}
      panelClassName={recipeBrowserStyles.detailModalPanel(theme)}
      title={detailTitle}
      titleClassName={recipeBrowserStyles.detailHeaderTitle}
      titleId={detailTitleId}
      onClose={onClose}
    >
          {deleteError !== null && <p className={recipeBrowserStyles.statusErrorWithOffset(theme)}>{deleteError}</p>}
          {pdfError !== null && <p className={recipeBrowserStyles.statusErrorWithOffset(theme)}>{pdfError}</p>}

          {activeDetail.kind === "recipe" ? (
            <RecipeDetailContent
              allRecipes={recipes}
              recipe={activeDetail.recipe}
              theme={theme}
              onIngredientClick={(ingredient) => navigateToDetail({ kind: "ingredient", ingredient })}
              onRecipeClick={(recipeId) => {
                const recipe = recipes.find((currentRecipe) => currentRecipe.recipeId === recipeId);
                if (recipe !== undefined) {
                  navigateToDetail({ kind: "recipe", recipe });
                }
              }}
            />
          ) : (
            <IngredientDetailContent ingredient={activeDetail.ingredient} theme={theme} />
          )}
        {isConfirmingDelete && (
          <ConfirmationDialog
            body={activeDetail.kind === "recipe" ? t.cookbook.removeRecipeBody : t.cookbook.removeIngredientBody}
            confirmLabel={t.common.remove}
            isBusy={isDeleting}
            theme={theme}
            title={t.common.removeNamed(getDetailName(activeDetail))}
            onCancel={() => setIsConfirmingDelete(false)}
            onConfirm={() => void handleRemove()}
          />
        )}
        {ingredientInUse !== null && activeDetail.kind === "ingredient" && (
          <IngredientInUseDialog
            ingredient={activeDetail.ingredient}
            ingredients={ingredients}
            theme={theme}
            uses={ingredientInUse}
            onCancel={() => setIngredientInUse(null)}
            onReplaced={async () => {
              await Promise.all([refreshIngredients(), refreshRecipes(), refreshMealPlan()]);
              onClose();
            }}
          />
        )}
    </Modal>
  );
}

function isSameDetail(first: BrowserDetailKey, second: BrowserDetailKey) {
  return first.kind === second.kind && first.id === second.id;
}

function resolveDetail(
  key: BrowserDetailKey,
  recipes: IRecipe[],
  ingredients: IIngredient[],
): BrowserDetail | null {
  if (key.kind === "recipe") {
    const recipe = recipes.find((item) => item.recipeId === key.id);
    return recipe === undefined ? null : { kind: "recipe", recipe };
  }

  const ingredient = ingredients.find((item) => item.ingredientId === key.id);
  return ingredient === undefined ? null : { kind: "ingredient", ingredient };
}

function getDetailName(detail: BrowserDetail) {
  return detail.kind === "recipe" ? detail.recipe.name : detail.ingredient.ingredientName;
}

export default BrowserDetailModal;
