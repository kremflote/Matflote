import Modal from "../Modal";
import { useLanguage } from "../../contexts";
import type { SiteTheme } from "../../styles/appStyles";
import { GroupedCheckboxPanel, type CheckboxGroup } from "./BrowserFilterGroups";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type TagPickerDialogProps<TValue extends string> = {
  addActionLabel: string;
  formatValue: (value: TValue) => string;
  groupLabels: Record<string, string>;
  groups: CheckboxGroup<TValue>[];
  selectedValues: TValue[];
  theme: SiteTheme;
  title: string;
  onAddTag: () => void;
  onClose: () => void;
  onToggle: (value: TValue) => void;
};

function TagPickerDialog<TValue extends string>({
  addActionLabel,
  formatValue,
  groupLabels,
  groups,
  selectedValues,
  theme,
  title,
  onAddTag,
  onClose,
  onToggle,
}: TagPickerDialogProps<TValue>) {
  const { t } = useLanguage();

  return (
    <Modal
      backdropClassName={recipeBrowserStyles.nestedModalBackdrop}
      bodyClassName={recipeBrowserStyles.nestedIngredientModalBody}
      closeButtonClassName={recipeBrowserStyles.modalCloseAligned(theme)}
      closeLabel={t.common.close}
      footer={
        <button className={`${recipeBrowserStyles.primaryButton(theme)} ${recipeBrowserStyles.formActionButton}`} type="button" onClick={onClose}>
          {t.common.confirm}
        </button>
      }
      footerClassName={recipeBrowserStyles.formActions}
      headerClassName={recipeBrowserStyles.modalHeader}
      panelClassName={recipeBrowserStyles.nestedIngredientModalPanel(theme)}
      title={title}
      titleClassName={recipeBrowserStyles.modalTitle}
      onClose={onClose}
    >
      <GroupedCheckboxPanel
        addActionLabel={addActionLabel}
        formatValue={formatValue}
        groupLabels={groupLabels}
        groups={groups}
        panelClassName={`${recipeBrowserStyles.groupedTagPanel} ${recipeBrowserStyles.checkboxGridPanel(theme)}`}
        selectedValues={selectedValues}
        theme={theme}
        onAddTag={onAddTag}
        onToggle={onToggle}
      />
    </Modal>
  );
}

export default TagPickerDialog;
