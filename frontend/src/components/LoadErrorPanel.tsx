import { useState } from "react";
import { useLanguage } from "../contexts";
import { loadErrorStyles, type SiteTheme } from "../styles/appStyles";

type LoadErrorPanelProps = {
  message: string | null;
  theme: SiteTheme;
  title: string;
  onRetry: () => Promise<unknown> | void;
};

/** Says that a load failed, with the reason and a Retry button. Announced to screen readers. */
function LoadErrorPanel({ message, theme, title, onRetry }: LoadErrorPanelProps) {
  const { t } = useLanguage();
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className={loadErrorStyles.panel(theme)} role="alert">
      <div className={loadErrorStyles.text}>
        <p className={loadErrorStyles.title}>{title}</p>
        {message !== null && <p className={loadErrorStyles.body}>{message}</p>}
      </div>
      <button
        className={loadErrorStyles.retryButton(theme)}
        disabled={isRetrying}
        type="button"
        onClick={() => void retry()}
      >
        {isRetrying ? t.common.retrying : t.common.retry}
      </button>
    </div>
  );
}

export default LoadErrorPanel;
