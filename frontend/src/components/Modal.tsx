import type { ReactNode } from "react";

type ModalProps = {
  describedBy?: string;
  labelledBy?: string;
  backdropClassName: string;
  children: ReactNode;
  panelClassName: string;
  onClose: () => void;
};

function Modal({ backdropClassName, children, describedBy, labelledBy, panelClassName, onClose }: ModalProps) {
  return (
    <div className={backdropClassName} role="presentation" onMouseDown={onClose}>
      <section
        aria-describedby={describedBy}
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={panelClassName}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}

export default Modal;
