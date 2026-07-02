import { useId, useState } from "react";
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
};

function BrowserDetailModal({ detail, theme, onClose }: BrowserDetailModalProps) {
  const editRecipeImageInputId = useId();
  const { refreshRecipes } = useRecipes();
  const { refreshIngredients } = useIngredients();
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isEditingIngredient, setIsEditingIngredient] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemove = async () => {
    const itemName = detail.kind === "recipe" ? detail.recipe.name : detail.ingredient.ingredientName;
    const itemLabel = detail.kind === "recipe" ? "recipe" : "ingredient";
    const confirmed = window.confirm(`Remove ${itemName}? This will delete the ${itemLabel}.`);
    if (!confirmed) {
      return;
    }

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
    }
  };

  if (detail.kind === "recipe" && isEditingRecipe) {
    return (
      <div className={recipeBrowserStyles.modalBackdrop} role="presentation" onMouseDown={onClose}>
        <section
          aria-modal="true"
          className={recipeBrowserStyles.modalPanel(theme)}
          role="dialog"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={recipeBrowserStyles.modalHeader}>
            <h2 className={recipeBrowserStyles.modalTitle}>Edit {detail.recipe.name}</h2>
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
          aria-modal="true"
          className={recipeBrowserStyles.modalPanel(theme)}
          role="dialog"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className={recipeBrowserStyles.modalHeader}>
            <h2 className={recipeBrowserStyles.modalTitle}>Edit {detail.ingredient.ingredientName}</h2>
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
        aria-modal="true"
        className={recipeBrowserStyles.modalPanel(theme)}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={recipeBrowserStyles.detailHeaderShell}>
          <div className={recipeBrowserStyles.detailHeaderRow}>
            <h2 className={recipeBrowserStyles.detailHeaderTitle}>
              {detail.kind === "recipe" ? detail.recipe.name : detail.ingredient.ingredientName}
            </h2>
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
              {detail.kind === "recipe"
                ? `Edit ${detail.recipe.recipeType === "Dish" ? "dish" : formatLabel(detail.recipe.recipeType).toLowerCase()}`
                : "Edit ingredient"}
            </button>
            <button
              className={recipeBrowserStyles.detailHeaderRemoveButton(theme)}
              disabled={isDeleting}
              type="button"
              onClick={handleRemove}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </button>
            <button className={recipeBrowserStyles.modalCloseAligned(theme)} type="button" onClick={onClose}>
              Close
            </button>
          </div>
          <div>
            {detail.kind === "recipe" && (
              <div className={recipeBrowserStyles.detailChipList}>
                {detail.recipe.tags.map((tag) => (
                  <span className={recipeBrowserStyles.filterChip(theme)} key={tag}>
                    {formatLabel(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {deleteError !== null && <p className={`mt-4 ${recipeBrowserStyles.statusError(theme)}`}>{deleteError}</p>}

        {detail.kind === "recipe" ? (
          <RecipeDetailContent recipe={detail.recipe} theme={theme} />
        ) : (
          <IngredientDetailContent ingredient={detail.ingredient} theme={theme} />
        )}
      </section>
    </div>
  );
}

export default BrowserDetailModal;
