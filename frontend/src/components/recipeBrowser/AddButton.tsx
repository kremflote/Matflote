import { useEffect, useId, useState } from "react";
import { useLanguage } from "../../contexts";
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
  const { t } = useLanguage();
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
        aria-label={t.common.add}
        className={recipeBrowserStyles.addButton(theme)}
        type="button"
        onClick={openModal}
      >
        <span aria-hidden="true">+</span>
        <span className={recipeBrowserStyles.addButtonLabel}>{t.common.add}</span>
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
                <h2 className={recipeBrowserStyles.modalTitle} id={modalTitleId}>{t.cookbook.create}</h2>
              </div>
              <button
                aria-label={t.common.close}
                className={recipeBrowserStyles.modalCloseButton(theme)}
                type="button"
                onClick={closeModal}
              >
                x
              </button>
            </div>

            <div className={recipeBrowserStyles.modalControlsRow}>
              <div className={recipeBrowserStyles.modalModeSwitch(theme)} aria-label={t.cookbook.create}>
                <button
                  className={recipeBrowserStyles.modalModeOption(theme, activeTarget === "recipe")}
                  type="button"
                  onClick={() => setActiveTarget("recipe")}
                >
                  {t.cookbook.recipeSingular}
                </button>
                <button
                  className={recipeBrowserStyles.modalModeOption(theme, activeTarget === "ingredient")}
                  type="button"
                  onClick={() => setActiveTarget("ingredient")}
                >
                  {t.cookbook.ingredientSingular}
                </button>
              </div>

            </div>

            {activeTarget === "recipe" ? (
              <RecipeCreateForm
                imageInputId={recipeImageInputId}
                showRecipeDetails={showRecipeDetails}
                theme={theme}
                onToggleRecipeDetails={() => setShowRecipeDetails((currentValue) => !currentValue)}
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
