import { useId, useState } from "react";
import { useLanguage } from "../../contexts";
import Modal from "../Modal";
import SuccessToast from "../SuccessToast";
import IngredientCreateForm from "./IngredientCreateForm";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import RecipeCreateForm from "./RecipeCreateForm";
import type { BrowserAddTarget } from "./types";

type AddButtonProps = {
  target: BrowserAddTarget;
};

function AddButton({ target }: AddButtonProps) {
  const { t } = useLanguage();
  const recipeImageInputId = useId();
  const modalTitleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState<BrowserAddTarget>(target);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openModal = () => {
    setActiveTarget(target);
    setShowRecipeDetails(false);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);
  const closeIngredientModal = (ingredientName?: string) => {
    closeModal();
    if (ingredientName !== undefined) {
      setSuccessMessage(t.common.ingredientAdded(ingredientName));
    }
  };

  return (
    <>
      <button
        aria-label={t.common.add}
        className={recipeBrowserStyles.addButton}
        type="button"
        onClick={openModal}
      >
        <span aria-hidden="true">+</span>
        <span className={recipeBrowserStyles.addButtonLabel}>{t.common.add}</span>
      </button>
      {isOpen && (
        <Modal
          backdropClassName={recipeBrowserStyles.modalBackdrop}
          closeButtonClassName={recipeBrowserStyles.modalCloseButton}
          closeLabel={t.common.close}
          headerClassName={recipeBrowserStyles.modalHeaderIntro}
          panelClassName={recipeBrowserStyles.modalPanel}
          title={t.cookbook.create}
          titleClassName={recipeBrowserStyles.modalTitle}
          titleId={modalTitleId}
          onClose={closeModal}
        >
            <div className={recipeBrowserStyles.modalControlsRow}>
              <div className={recipeBrowserStyles.modalModeSwitch} aria-label={t.cookbook.create}>
                <button
                  className={recipeBrowserStyles.modalModeOption(activeTarget === "recipe")}
                  type="button"
                  onClick={() => setActiveTarget("recipe")}
                >
                  {t.cookbook.recipeSingular}
                </button>
                <button
                  className={recipeBrowserStyles.modalModeOption(activeTarget === "ingredient")}
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
                onToggleRecipeDetails={() => setShowRecipeDetails((currentValue) => !currentValue)}
                onCancel={closeModal}
                onCreated={closeModal}
              />
            ) : (
              <IngredientCreateForm onCancel={closeModal} onCreated={closeIngredientModal} />
            )}
        </Modal>
      )}
      {successMessage !== null && (
        <SuccessToast
          closeLabel={t.common.close}
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </>
  );
}

export default AddButton;
