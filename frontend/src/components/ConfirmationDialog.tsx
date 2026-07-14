import { useEffect, useId, useRef, type ReactNode } from "react";
import { useLanguage } from "../contexts";
import { confirmationDialogStyles, type SiteTheme } from "../styles/appStyles";

type ConfirmationDialogProps = {
  body: ReactNode;
  confirmLabel?: string;
  isBusy?: boolean;
  theme: SiteTheme;
  title: string;
  tone?: "danger" | "default";
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmationDialog({
  body,
  confirmLabel,
  isBusy = false,
  theme,
  title,
  tone = "danger",
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const { t } = useLanguage();
  const titleId = useId();
  const bodyId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className={confirmationDialogStyles.backdrop} role="presentation" onMouseDown={onCancel}>
      <section
        aria-describedby={bodyId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={confirmationDialogStyles.panel(theme)}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={confirmationDialogStyles.title} id={titleId}>{title}</h2>
        <div className={confirmationDialogStyles.body(theme)} id={bodyId}>{body}</div>
        <div className={confirmationDialogStyles.actions}>
          <button
            className={`${confirmationDialogStyles.cancelButton(theme)} ${confirmationDialogStyles.actionButton}`}
            disabled={isBusy}
            ref={cancelButtonRef}
            type="button"
          onClick={onCancel}
        >
            {t.common.cancel}
          </button>
          <button
            className={`${confirmationDialogStyles.confirmButton(theme, tone)} ${confirmationDialogStyles.actionButton}`}
            disabled={isBusy}
            type="button"
            onClick={onConfirm}
        >
            {isBusy ? t.common.working : confirmLabel ?? t.common.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmationDialog;
