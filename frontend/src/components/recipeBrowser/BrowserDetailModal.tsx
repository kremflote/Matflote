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
  onSelectDetail: (detail: BrowserDetail) => void;
};

function BrowserDetailModal({ detail, theme, onClose, onSelectDetail }: BrowserDetailModalProps) {
  const { t } = useLanguage();
  const editRecipeImageInputId = useId();
  const editTitleId = useId();
  const detailTitleId = useId();
  const { refreshRecipes } = useRecipes();
  const { refreshIngredients } = useIngredients();
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isEditingIngredient, setIsEditingIngredient] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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

  const handleRemove = async () => {
    const itemLabel = detail.kind === "recipe" ? "recipe" : "ingredient";

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (detail.kind === "recipe") {
        await recipeService.delete(detail.recipe.recipeId);
        await refreshRecipes();
      } else {
        await ingredientService.delete(detail.ingredient.ingredientId);
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

  if (detail.kind === "recipe" && isEditingRecipe) {
    return (
      <Modal
        backdropClassName={recipeBrowserStyles.modalBackdrop}
        closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
        closeLabel={t.common.close}
        headerClassName={recipeBrowserStyles.modalHeader}
        panelClassName={recipeBrowserStyles.modalPanel(theme)}
        title={`${t.common.edit} ${detail.recipe.name}`}
        titleClassName={recipeBrowserStyles.modalTitle}
        titleId={editTitleId}
        onClose={onClose}
      >
        <RecipeCreateForm
          imageInputId={editRecipeImageInputId}
          initialRecipe={detail.recipe}
          showRecipeDetails
          theme={theme}
          onCancel={() => setIsEditingRecipe(false)}
          onCreated={onClose}
        />
      </Modal>
    );
  }

  if (detail.kind === "ingredient" && isEditingIngredient) {
    return (
      <Modal
        backdropClassName={recipeBrowserStyles.modalBackdrop}
        closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
        closeLabel={t.common.close}
        headerClassName={recipeBrowserStyles.modalHeader}
        panelClassName={recipeBrowserStyles.modalPanel(theme)}
        title={`${t.common.edit} ${detail.ingredient.ingredientName}`}
        titleClassName={recipeBrowserStyles.modalTitle}
        titleId={editTitleId}
        onClose={onClose}
      >
        <IngredientCreateForm
          initialIngredient={detail.ingredient}
          theme={theme}
          onCancel={() => setIsEditingIngredient(false)}
          onCreated={onClose}
        />
      </Modal>
    );
  }

  const detailTitle =
    detail.kind === "recipe" ? (
      <span className={recipeBrowserStyles.detailHeaderTitleRow}>
        <span>{detail.recipe.name}</span>
        <span className={recipeBrowserStyles.detailHeaderTagList}>
          {detail.recipe.tags
            .filter((tag) => recipeTags.includes(tag))
            .map((tag) => (
              <span className={recipeBrowserStyles.filterChip(theme)} key={tag}>
                {t.enums.recipeTags[tag]}
              </span>
            ))}
        </span>
      </span>
    ) : (
      detail.ingredient.ingredientName
    );

  const detailTags =
    detail.kind === "ingredient" ? (
      <div className={recipeBrowserStyles.detailHeaderTagList}>
        {detail.ingredient.tags.map((tag) => (
          <span className={recipeBrowserStyles.filterChip(theme)} key={tag}>
            {t.enums.ingredientTags[tag]}
          </span>
        ))}
      </div>
    ) : undefined;

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.modalBackdrop}
      bodyClassName={recipeBrowserStyles.detailBodyScrollArea}
      closeButtonClassName={recipeBrowserStyles.detailCloseButton(theme)}
      closeLabel={t.common.close}
      description={detailTags}
      descriptionClassName={recipeBrowserStyles.detailHeaderDescription}
      footer={
        <>
          <button
            className={recipeBrowserStyles.detailHeaderEditButton(theme)}
            type="button"
            onClick={() => {
              if (detail.kind === "recipe") {
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

          {detail.kind === "recipe" ? (
            <RecipeDetailContent
              recipe={detail.recipe}
              theme={theme}
              onIngredientClick={(ingredient) => onSelectDetail({ kind: "ingredient", ingredient })}
            />
          ) : (
            <IngredientDetailContent ingredient={detail.ingredient} theme={theme} />
          )}
        {isConfirmingDelete && (
          <ConfirmationDialog
            body={`This will delete ${detail.kind === "recipe" ? "the recipe" : "the ingredient"}.`}
            confirmLabel={t.common.remove}
            isBusy={isDeleting}
            theme={theme}
            title={`Remove ${detail.kind === "recipe" ? detail.recipe.name : detail.ingredient.ingredientName}?`}
            onCancel={() => setIsConfirmingDelete(false)}
            onConfirm={() => void handleRemove()}
          />
        )}
    </Modal>
  );
}

export default BrowserDetailModal;
