import { Component, type ErrorInfo, type ReactNode } from "react";
import { getDocumentTranslations } from "../i18n";
import { errorBoundaryStyles } from "../styles/appStyles";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Catches a rendering error anywhere below it and shows a page with a Reload button instead of a
 * blank screen. It sits outside the providers, so it reads the language from <html lang>.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("MATFLOTE crashed while rendering", error, info.componentStack);
  }

  render() {
    if (this.state.error === null) {
      return this.props.children;
    }

    const t = getDocumentTranslations().common;

    return (
      <main className={errorBoundaryStyles.shell}>
        <section className={errorBoundaryStyles.panel} role="alert">
          <h1 className={errorBoundaryStyles.title}>{t.somethingWentWrong}</h1>
          <p className={errorBoundaryStyles.body}>{t.somethingWentWrongBody}</p>
          <pre className={errorBoundaryStyles.details}>{this.state.error.message}</pre>
          <button className={errorBoundaryStyles.button} type="button" onClick={() => window.location.reload()}>
            {t.reload}
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
