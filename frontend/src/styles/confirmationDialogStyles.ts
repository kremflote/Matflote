import {
  controlStyles,
  shadowClasses,
  surfaceClasses,
  type SiteTheme,
} from "./appStyles";

export const confirmationDialogStyles = {
  backdrop:
    "fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4",
  panel: (theme: SiteTheme) =>
    `grid w-full max-w-md grid-rows-[auto_minmax(0,1fr)_auto] gap-4 rounded-md border p-6 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  header: "flex items-start justify-between gap-4",
  title: "text-xl font-bold leading-tight",
  closeButton: controlStyles.modalCloseButton,
  bodyFrame: "min-h-0",
  body: (theme: SiteTheme) =>
    `text-sm font-semibold leading-[1.5] ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  settingsGroup: "mt-4 grid gap-3",
  fieldLabel: "grid gap-2",
  fieldTitle: (theme: SiteTheme) =>
    `text-xs font-extrabold uppercase leading-tight ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  numberInput: (theme: SiteTheme) =>
    `${controlStyles.formField(theme)} max-w-28`,
  fieldHelp: (theme: SiteTheme) =>
    `text-xs font-semibold leading-[1.4] ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  actions: "flex flex-wrap items-center justify-end gap-3 max-sm:flex-nowrap",
  actionButton:
    "max-sm:h-10 max-sm:min-w-0 max-sm:flex-1 max-sm:px-3 max-sm:text-sm",
  cancelButton: controlStyles.secondaryButton,
  confirmButton: (theme: SiteTheme, tone: "danger" | "default") => {
    if (tone === "danger") {
      return controlStyles.removeButton(theme);
    }

    return controlStyles.primaryButton(theme);
  },
} as const;
