import { useEffect, useId, useState } from "react";
import type { SiteTheme } from "../../styles/appStyles";
import IngredientCreateForm from "./IngredientCreateForm";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import RecipeCreateForm from "./RecipeCreateForm";
import type { BrowserAddTarget } from "./types";

type AddButtonProps = {
  target: BrowserAddTarget;
  theme: SiteTheme;
};

function AddButton({ target, theme }: AddButtonProps) {
  const recipeImageInputId = useId();
  const modalTitleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<BrowserAddTarget>(target);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);

  const openModal = () => {
    setActiveTarget(target);
    setShowRecipeDetails(false);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        className={recipeBrowserStyles.addButton(theme)}
        type="button"
        onClick={openModal}
      >
        + Add
      </button>
      {isOpen && (
        <div className={recipeBrowserStyles.modalBackdrop} role="presentation" onMouseDown={closeModal}>
          <section
            aria-labelledby={modalTitleId}
            aria-modal="true"
            className={recipeBrowserStyles.modalPanel(theme)}
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={recipeBrowserStyles.modalHeaderIntro}>
              <div>
                <h2 className={recipeBrowserStyles.modalTitle} id={modalTitleId}>Create</h2>
                <p className={recipeBrowserStyles.modalIntroText}>
                  Add recipes, desserts, sauces, ingredients, and the rest of the kitchen library.
                </p>
              </div>
              <button
                aria-label="Close"
                className={recipeBrowserStyles.modalCloseButton(theme)}
                type="button"
                onClick={closeModal}
              >
                x
              </button>
            </div>

            <div className={recipeBrowserStyles.modalControlsRow}>
              <div className={recipeBrowserStyles.modalModeSwitch(theme)} aria-label="Choose what to create">
                <button
                  className={recipeBrowserStyles.modalModeOption(theme, activeTarget === "recipe")}
                  type="button"
                  onClick={() => setActiveTarget("recipe")}
                >
                  Recipe
                </button>
                <button
                  className={recipeBrowserStyles.modalModeOption(theme, activeTarget === "ingredient")}
                  type="button"
                  onClick={() => setActiveTarget("ingredient")}
                >
                  Ingredient
                </button>
              </div>

              {activeTarget === "recipe" && (
                <button
                  aria-expanded={showRecipeDetails}
                  className={recipeBrowserStyles.detailsToggle(theme)}
                  type="button"
                  onClick={() => setShowRecipeDetails((currentValue) => !currentValue)}
                >
                  {showRecipeDetails ? "Hide recipe details" : "Add recipe details"}
                </button>
              )}
            </div>

            {activeTarget === "recipe" ? (
              <RecipeCreateForm
                imageInputId={recipeImageInputId}
                showRecipeDetails={showRecipeDetails}
                theme={theme}
                onCancel={closeModal}
                onCreated={closeModal}
              />
            ) : (
              <IngredientCreateForm theme={theme} onCancel={closeModal} onCreated={closeModal} />
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default AddButton;
