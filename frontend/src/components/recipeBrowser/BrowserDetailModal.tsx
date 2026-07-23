import { useEffect, useId, useState } from "react";
import ConfirmationDialog from "../ConfirmationDialog";
import { useIngredients, useLanguage, useRecipes } from "../../contexts";
import { ingredientService, recipeService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import Modal from "../Modal";
import IngredientCreateForm from "./IngredientCreateForm";
import IngredientDetailContent from "./IngredientDetailContent";
import RecipeCreateForm from "./RecipeCreateForm";
import RecipeDetailContent from "./RecipeDetailContent";
import { recipeTags } from "./formOptions";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserDetail } from "./types";

type BrowserDetailModalProps = {
  detail: BrowserDetail;
  theme: SiteTheme;
  onClose: () => void;
};

function BrowserDetailModal({ detail, theme, onClose }: BrowserDetailModalProps) {
  const { t } = useLanguage();
  const editRecipeImageInputId = useId();
  const editTitleId = useId();
  const detailTitleId = useId();
  const { recipes, refreshRecipes } = useRecipes();
  const { refreshIngredients } = useIngredients();
  const [activeDetail, setActiveDetail] = useState(detail);
  const [detailHistory, setDetailHistory] = useState<BrowserDetail[]>([]);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isEditingIngredient, setIsEditingIngredient] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setActiveDetail(detail);
    setDetailHistory([]);
    setIsEditingRecipe(false);
    setIsEditingIngredient(false);
    setDeleteError(null);
    setIsConfirmingDelete(false);
  }, [detail]);

  useEffect(() => {
    if (isConfirmingDelete) {
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
  }, [isConfirmingDelete, onClose]);

  const navigateToDetail = (nextDetail: BrowserDetail) => {
    if (isSameDetail(activeDetail, nextDetail)) {
      return;
    }

    setDetailHistory((currentHistory) => [...currentHistory, activeDetail]);
    setActiveDetail(nextDetail);
    setIsEditingRecipe(false);
    setIsEditingIngredient(false);
    setDeleteError(null);
    setIsConfirmingDelete(false);
  };

  const navigateBack = () => {
    setDetailHistory((currentHistory) => {
      const previousDetail = currentHistory.at(-1);

      if (previousDetail === undefined) {
        return currentHistory;
      }

      setActiveDetail(previousDetail);
      setIsEditingRecipe(false);
      setIsEditingIngredient(false);
      setDeleteError(null);
      setIsConfirmingDelete(false);
      return currentHistory.slice(0, -1);
    });
  };

  const handleRemove = async () => {
    const itemLabel = activeDetail.kind === "recipe" ? "recipe" : "ingredient";

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
      setDeleteError(caughtError instanceof Error ? caughtError.message : `Could not remove ${itemLabel}.`);
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
            body={`This will delete ${activeDetail.kind === "recipe" ? "the recipe" : "the ingredient"}.`}
            confirmLabel={t.common.remove}
            isBusy={isDeleting}
            theme={theme}
            title={`Remove ${getDetailName(activeDetail)}?`}
            onCancel={() => setIsConfirmingDelete(false)}
            onConfirm={() => void handleRemove()}
          />
        )}
    </Modal>
  );
}

function isSameDetail(first: BrowserDetail, second: BrowserDetail) {
  if (first.kind === "recipe") {
    return second.kind === "recipe" && first.recipe.recipeId === second.recipe.recipeId;
  }

  return second.kind === "ingredient" && first.ingredient.ingredientId === second.ingredient.ingredientId;
}

function getDetailName(detail: BrowserDetail) {
  return detail.kind === "recipe" ? detail.recipe.name : detail.ingredient.ingredientName;
}

export default BrowserDetailModal;
