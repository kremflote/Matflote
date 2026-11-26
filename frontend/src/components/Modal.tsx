import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type ModalProps = {
  bodyClassName?: string;
  describedBy?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  descriptionId?: string;
  footer?: ReactNode;
  footerClassName?: string;
  headerClassName?: string;
  /** Receives focus when the dialog opens. Defaults to the close button, then the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  labelledBy?: string;
  backdropClassName: string;
  children: ReactNode;
  closeButtonClassName?: string;
  closeLabel?: string;
  panelClassName: string;
  title?: ReactNode;
  titleClassName?: string;
  titleId?: string;
  onClose: () => void;
};

// Every open dialog, in the order it was rendered. Only the last one reacts to Escape and Tab.
// The order is taken during render because a parent renders before a child it opens in the same
// update, whereas the child's effects run first.
let openOrderCounter = 0;
const openDialogs: number[] = [];
let lockedOverflow: string | null = null;

function isTopDialog(order: number) {
  return openDialogs.length > 0 && Math.max(...openDialogs) === order;
}

function addOpenDialog(order: number) {
  if (openDialogs.length === 0) {
    const root = document.documentElement;
    lockedOverflow = root.style.overflow;
    root.style.overflow = "hidden";
  }

  openDialogs.push(order);
}

function removeOpenDialog(order: number) {
  const index = openDialogs.indexOf(order);
  if (index !== -1) {
    openDialogs.splice(index, 1);
  }

  if (openDialogs.length === 0 && lockedOverflow !== null) {
    document.documentElement.style.overflow = lockedOverflow;
    lockedOverflow = null;
  }
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isVisible(element: HTMLElement) {
  // checkVisibility is missing in older browsers and in jsdom; treat the element as visible there.
  return typeof element.checkVisibility === "function" ? element.checkVisibility() : true;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element === document.activeElement || isVisible(element),
  );
}

function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;
  const focusIsInside = activeElement instanceof Node && container.contains(activeElement);

  if (!focusIsInside || activeElement === container) {
    event.preventDefault();
    (event.shiftKey ? lastElement : firstElement).focus();
    return;
  }

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

/**
 * The one dialog implementation. While open it focuses one element once, keeps Tab inside the
 * panel, closes on Escape (only the top-most dialog), locks page scrolling, and on close returns
 * focus to the element that opened it.
 */
const Modal = forwardRef<HTMLElement, ModalProps>(function Modal(
  {
    backdropClassName,
    bodyClassName,
    children,
    closeButtonClassName,
    closeLabel,
    describedBy,
    description,
    descriptionClassName,
    descriptionId,
    footer,
    footerClassName,
    headerClassName,
    initialFocusRef,
    labelledBy,
    panelClassName,
    title,
    titleClassName,
    titleId,
    onClose,
  },
  ref,
) {
  const hasHeader = title !== undefined || closeLabel !== undefined;
  const panelRef = useRef<HTMLElement | null>(null);
  const ownCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  const initialFocusRefRef = useRef(initialFocusRef);
  const [openOrder] = useState(() => ++openOrderCounter);
  const [focusedBeforeRender] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );

  useImperativeHandle(ref, () => panelRef.current as HTMLElement, []);

  // Callers pass inline functions; keep the latest one without re-running the effects below.
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    initialFocusRefRef.current = initialFocusRef;
  });

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }

    // When one dialog replaces another, the old one has already handed focus back to its opener.
    const activeElement = document.activeElement;
    const opener =
      activeElement instanceof HTMLElement && activeElement !== document.body && !panel.contains(activeElement)
        ? activeElement
        : focusedBeforeRender instanceof HTMLElement && !panel.contains(focusedBeforeRender)
          ? focusedBeforeRender
          : null;

    addOpenDialog(openOrder);

    const initialTarget =
      initialFocusRefRef.current?.current ?? ownCloseButtonRef.current ?? getFocusableElements(panel)[0] ?? panel;
    initialTarget.focus();

    return () => {
      removeOpenDialog(openOrder);
      if (opener?.isConnected) {
        opener.focus();
      }
    };
  }, [focusedBeforeRender, openOrder]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopDialog(openOrder) || event.defaultPrevented) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab" && panelRef.current !== null) {
        trapFocus(event, panelRef.current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openOrder]);

  return (
    <div className={backdropClassName} role="presentation" onMouseDown={onClose}>
      <section
        aria-describedby={describedBy ?? descriptionId}
        aria-labelledby={labelledBy ?? titleId}
        aria-modal="true"
        className={panelClassName}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {hasHeader && (
          <div className={headerClassName}>
            <div>
              {title !== undefined && (
                <h2 className={titleClassName} id={titleId}>
                  {title}
                </h2>
              )}
              {description !== undefined && (
                <div className={descriptionClassName} id={descriptionId}>
                  {description}
                </div>
              )}
            </div>
            {closeLabel !== undefined && closeButtonClassName !== undefined && (
              <button
                aria-label={closeLabel}
                className={closeButtonClassName}
                ref={ownCloseButtonRef}
                type="button"
                onClick={onClose}
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.25"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        {bodyClassName === undefined ? children : <div className={bodyClassName}>{children}</div>}
        {footer !== undefined && <div className={footerClassName}>{footer}</div>}
      </section>
    </div>
  );
});

export default Modal;
