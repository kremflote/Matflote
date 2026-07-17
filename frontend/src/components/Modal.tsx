import { forwardRef, type ReactNode, type Ref } from "react";

type ModalProps = {
  bodyClassName?: string;
  describedBy?: string;
  description?: ReactNode;
  descriptionClassName?: string;
  descriptionId?: string;
  footer?: ReactNode;
  footerClassName?: string;
  headerClassName?: string;
  labelledBy?: string;
  backdropClassName: string;
  children: ReactNode;
  closeButtonClassName?: string;
  closeButtonRef?: Ref<HTMLButtonElement>;
  closeLabel?: string;
  panelClassName: string;
  title?: ReactNode;
  titleClassName?: string;
  titleId?: string;
  onClose: () => void;
};

const Modal = forwardRef<HTMLElement, ModalProps>(function Modal(
  {
    backdropClassName,
    bodyClassName,
    children,
    closeButtonClassName,
    closeButtonRef,
    closeLabel,
    describedBy,
    description,
    descriptionClassName,
    descriptionId,
    footer,
    footerClassName,
    headerClassName,
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

  return (
    <div className={backdropClassName} role="presentation" onMouseDown={onClose}>
      <section
        aria-describedby={describedBy ?? descriptionId}
        aria-labelledby={labelledBy ?? titleId}
        aria-modal="true"
        className={panelClassName}
        ref={ref}
        role="dialog"
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
                ref={closeButtonRef}
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
