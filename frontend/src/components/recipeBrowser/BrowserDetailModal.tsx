import { useEffect, useId, useState } from "react";
import ConfirmationDialog from "../ConfirmationDialog";
import { useIngredients, useRecipes } from "../../contexts";
import { ingredientService, recipeService } from "../../services";
import type { SiteTheme } from "../../styles/appStyles";
import IngredientCreateForm from "./IngredientCreateForm";
import IngredientDetailContent from "./IngredientDetailContent";
import RecipeCreateForm from "./RecipeCreateForm";
import RecipeDetailContent from "./RecipeDetailContent";
import { formatLabel, recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserDetail } from "./types";

type BrowserDetailModalProps = {
  detail: BrowserDetail;
  theme: SiteTheme;
  onClose: () => void;
  onSelectDetail: (detail: BrowserDetail) => void;
};

function BrowserDetailModal({ detail, theme, onClose, onSelectDetail }: BrowserDetailModalProps) {
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
      <div className={recipeBrowserStyles.modalBackdrop} role="presentation" onMouseDown={onClose}>
        <section
          aria-labelledby={editTitleId}
          aria-modal="true"
          className={recipeBrowserStyles.modalPanel(theme)}
          role="dialog"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={recipeBrowserStyles.modalHeader}>
            <h2 className={recipeBrowserStyles.modalTitle} id={editTitleId}>Edit {detail.recipe.name}</h2>
            <button className={recipeBrowserStyles.modalCloseAligned(theme)} type="button" onClick={onClose}>
              Close
            </button>
          </div>

          <RecipeCreateForm
            imageInputId={editRecipeImageInputId}
            initialRecipe={detail.recipe}
            showRecipeDetails
            theme={theme}
            onCancel={() => setIsEditingRecipe(false)}
            onCreated={onClose}
          />
        </section>
      </div>
    );
  }

  if (detail.kind === "ingredient" && isEditingIngredient) {
    return (
      <div className={recipeBrowserStyles.modalBackdrop} role="presentation" onMouseDown={onClose}>
        <section
          aria-labelledby={editTitleId}
          aria-modal="true"
          className={recipeBrowserStyles.modalPanel(theme)}
          role="dialog"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={recipeBrowserStyles.modalHeader}>
            <h2 className={recipeBrowserStyles.modalTitle} id={editTitleId}>Edit {detail.ingredient.ingredientName}</h2>
            <button className={recipeBrowserStyles.modalCloseAligned(theme)} type="button" onClick={onClose}>
              Close
            </button>
          </div>

          <IngredientCreateForm
            initialIngredient={detail.ingredient}
            theme={theme}
            onCancel={() => setIsEditingIngredient(false)}
            onCreated={onClose}
          />
        </section>
      </div>
    );
  }

  return (
    <div className={recipeBrowserStyles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={detailTitleId}
        aria-modal="true"
        className={recipeBrowserStyles.modalPanel(theme)}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={recipeBrowserStyles.detailHeaderShell}>
          <div className={recipeBrowserStyles.detailHeaderTitleRow}>
            <h2 className={recipeBrowserStyles.detailHeaderTitle} id={detailTitleId}>
              {detail.kind === "recipe" ? detail.recipe.name : detail.ingredient.ingredientName}
            </h2>
            {detail.kind === "recipe" && (
              <div className={recipeBrowserStyles.detailHeaderTagList}>
                {detail.recipe.tags.map((tag) => (
                  <span className={recipeBrowserStyles.filterChip(theme)} key={tag}>
                    {formatLabel(tag)}
                  </span>
                ))}
              </div>
            )}
            {detail.kind === "ingredient" && (
              <div className={recipeBrowserStyles.detailHeaderTagList}>
                {detail.ingredient.tags.map((tag) => (
                  <span className={recipeBrowserStyles.filterChip(theme)} key={tag}>
                    {formatLabel(tag)}
                  </span>
                ))}
              </div>
            )}
            <button className={recipeBrowserStyles.modalCloseAligned(theme)} type="button" onClick={onClose}>
              Close
            </button>
          </div>
          <div className={recipeBrowserStyles.detailHeaderActionRow}>
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
              Edit
            </button>
            <button
              className={recipeBrowserStyles.detailHeaderRemoveButton(theme)}
              disabled={isDeleting}
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>

        {deleteError !== null && <p className={`mt-4 ${recipeBrowserStyles.statusError(theme)}`}>{deleteError}</p>}

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
            confirmLabel="Remove"
            isBusy={isDeleting}
            theme={theme}
            title={`Remove ${detail.kind === "recipe" ? detail.recipe.name : detail.ingredient.ingredientName}?`}
            onCancel={() => setIsConfirmingDelete(false)}
            onConfirm={() => void handleRemove()}
          />
        )}
      </section>
    </div>
  );
}

export default BrowserDetailModal;
