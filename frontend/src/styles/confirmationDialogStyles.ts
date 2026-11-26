import {
  controlStyles,
  shadowClasses,
  surfaceClasses,
} from "./appStyles";

export const confirmationDialogStyles = {
  backdrop:
    "fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4",
  panel: `grid w-full max-w-md grid-rows-[auto_minmax(0,1fr)_auto] gap-4 rounded-md border p-6 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  header: "flex items-start justify-between gap-4",
  title: "text-xl font-bold leading-tight",
  closeButton: controlStyles.modalCloseButton,
  bodyFrame: "min-h-0",
  body: "text-sm font-semibold leading-[1.5] text-olive-dark dark:text-neutral-300",
  settingsGroup: "mt-4 grid gap-3",
  fieldLabel: "grid gap-2",
  fieldTitle: "text-xs font-extrabold uppercase leading-tight text-olive-dark dark:text-neutral-300",
  numberInput: `${controlStyles.formField} max-w-28`,
  fieldHelp: "text-xs font-semibold leading-[1.4] text-olive-dark dark:text-neutral-400",
  actions: "flex flex-wrap items-center justify-end gap-3 max-sm:flex-nowrap",
  actionButton:
    "max-sm:h-10 max-sm:min-w-0 max-sm:flex-1 max-sm:px-3 max-sm:text-sm",
  cancelButton: controlStyles.secondaryButton,
  confirmButton: (tone: "danger" | "default") => {
    if (tone === "danger") {
      return controlStyles.removeButton;
    }

    return controlStyles.primaryButton;
  },
} as const;
