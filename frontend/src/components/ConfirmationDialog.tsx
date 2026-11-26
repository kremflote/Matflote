import { useId, type ReactNode } from "react";
import { useLanguage } from "../contexts";
import { confirmationDialogStyles } from "../styles/confirmationDialogStyles";
import Modal from "./Modal";

type ConfirmationDialogProps = {
  body: ReactNode;
  confirmLabel?: string;
  isBusy?: boolean;
  /** Disables the confirm button, for example until a required choice is made. */
  isConfirmDisabled?: boolean;
  title: string;
  tone?: "danger" | "default";
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmationDialog({
  body,
  confirmLabel,
  isBusy = false,
  isConfirmDisabled = false,
  title,
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const bodyId = useId();
  return (
    <Modal
      backdropClassName={confirmationDialogStyles.backdrop}
      bodyClassName={confirmationDialogStyles.bodyFrame}
      closeButtonClassName={confirmationDialogStyles.closeButton}
      closeLabel={t.common.close}
      describedBy={bodyId}
      footer={
        <>
          <button
            className={`${confirmationDialogStyles.cancelButton} ${confirmationDialogStyles.actionButton}`}
            disabled={isBusy}
            type="button"
            onClick={onCancel}
          >
            {t.common.cancel}
          </button>
          <button
            className={`${confirmationDialogStyles.confirmButton(tone)} ${confirmationDialogStyles.actionButton}`}
            disabled={isBusy || isConfirmDisabled}
            type="button"
            onClick={onConfirm}
          >
            {isBusy ? t.common.working : confirmLabel ?? t.common.confirm}
          </button>
        </>
      }
      footerClassName={confirmationDialogStyles.actions}
      headerClassName={confirmationDialogStyles.header}
      panelClassName={confirmationDialogStyles.panel}
      title={title}
      titleClassName={confirmationDialogStyles.title}
      titleId={titleId}
      onClose={onCancel}
    >
      <div className={confirmationDialogStyles.body} id={bodyId}>{body}</div>
    </Modal>
  );
}

export default ConfirmationDialog;
