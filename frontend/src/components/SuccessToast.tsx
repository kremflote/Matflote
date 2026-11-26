import { useEffect } from "react";
import { toastStyles } from "../styles/appStyles";

type SuccessToastProps = {
  closeLabel: string;
  message: string;
  durationMs?: number;
  onClose: () => void;
};

function SuccessToast({
  durationMs = 2600,
  closeLabel,
  message,
  onClose,
}: SuccessToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [durationMs, onClose]);

  return (
    <div className={toastStyles.viewport} role="status" aria-live="polite">
      <div className={toastStyles.success}>
        <span>{message}</span>
        <button
          aria-label={closeLabel}
          className={toastStyles.closeButton}
          type="button"
          onClick={onClose}
        >
          x
        </button>
      </div>
    </div>
  );
}

export default SuccessToast;
