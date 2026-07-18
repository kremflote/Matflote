import { useId, useState } from "react";
import { useLanguage } from "../../contexts";
import type { IngredientTag } from "../../interfaces/IIngredient";
import type { SiteTheme } from "../../styles/appStyles";
import Modal from "../Modal";
import { ingredientTagGroups, normalizeCustomTagName, type IngredientTagGroupKey } from "./formOptions";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type IngredientTagCreateDialogProps = {
  existingTags: readonly IngredientTag[];
  theme: SiteTheme;
  onCancel: () => void;
  onCreate: (tag: IngredientTag, group: IngredientTagGroupKey) => void;
};

function IngredientTagCreateDialog({
  existingTags,
  theme,
  onCancel,
  onCreate,
}: IngredientTagCreateDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const [name, setName] = useState("");
  const [group, setGroup] = useState<IngredientTagGroupKey>("produce");
  const normalizedName = normalizeCustomTagName(name);
  const tagExists = existingTags.some((tag) => tag.toLowerCase() === normalizedName.toLowerCase());
  const canCreate = normalizedName.length > 0 && !tagExists;

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
      closeLabel={t.common.close}
      footer={
        <>
          <button className={`${recipeBrowserStyles.secondaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onCancel}>
            {t.common.cancel}
          </button>
          <button
            className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`}
            disabled={!canCreate}
            type="button"
            onClick={() => onCreate(normalizedName, group)}
          >
            {t.common.addTag}
          </button>
        </>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title={t.common.addTag}
      titleClassName={recipeBrowserStyles.modalTitle}
      titleId={titleId}
      onClose={onCancel}
    >
      <label className={recipeBrowserStyles.field}>
        <span className={recipeBrowserStyles.label(theme)}>{t.cookbook.name}</span>
        <input
          className={recipeBrowserStyles.textField(theme)}
          maxLength={64}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className={recipeBrowserStyles.field}>
        <span className={recipeBrowserStyles.label(theme)}>{t.filters.categories}</span>
        <select
          className={recipeBrowserStyles.textField(theme)}
          value={group}
          onChange={(event) => setGroup(event.target.value as IngredientTagGroupKey)}
        >
          {ingredientTagGroups.map((tagGroup) => (
            <option key={tagGroup.key} value={tagGroup.key}>
              {t.filters.ingredientTagGroups[tagGroup.key]}
            </option>
          ))}
        </select>
      </label>
      {tagExists && (
        <p className={recipeBrowserStyles.statusError(theme)}>
          {t.common.nameAlreadyExists}
        </p>
      )}
    </Modal>
  );
}

export default IngredientTagCreateDialog;
