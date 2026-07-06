export type SiteTheme = "dark" | "light" | "paletteLight";

export const colorPalette = {
  dustyBlue: "#A9BDD1",
  olive: "#7A8864",
  oliveDark: "#556145",
  oliveDeep: "#6A7658",
  stone: "#C8C0B5",
  ingredientIcon: "#F8F0D7",
  ingredientIconText: "#333929",
  champagne: "#E5D5BC",
  paleGold: "#FAF7F2",
  addGold: "#FFD64F",
  addGoldHover: "#EEC642",
  ivory: "#FAF7F2",
  nearBlack: "#171717",
  softGray: "#F5F5F5",
} as const;

export const colorPaletteClasses = {
  background: {
    dustyBlue: "bg-[#A9BDD1]",
    olive: "bg-[#7A8864]",
    oliveDark: "bg-[#556145]",
    oliveDeep: "bg-[#6A7658]",
    stone: "bg-[#C8C0B5]",
    ingredientIcon: "bg-[#F8F0D7]",
    ingredientIconText: "bg-[#333929]",
    champagne: "bg-[#E5D5BC]",
    paleGold: "bg-[#FAF7F2]",
    addGold: "bg-[#FFD64F]",
    addGoldHover: "bg-[#EEC642]",
    ivory: "bg-[#FAF7F2]",
    nearBlack: "bg-[#171717]",
    softGray: "bg-[#F5F5F5]",
  },
  border: {
    dustyBlue: "border-[#A9BDD1]",
    olive: "border-[#7A8864]",
    oliveDark: "border-[#556145]",
    oliveDeep: "border-[#6A7658]",
    stone: "border-[#C8C0B5]",
    ingredientIcon: "border-[#F8F0D7]",
    ingredientIconText: "border-[#333929]",
    champagne: "border-[#E5D5BC]",
    paleGold: "border-[#FAF7F2]",
    addGold: "border-[#FFD64F]",
    addGoldHover: "border-[#EEC642]",
    ivory: "border-[#FAF7F2]",
    nearBlack: "border-[#171717]",
    softGray: "border-[#F5F5F5]",
  },
  text: {
    dustyBlue: "text-[#A9BDD1]",
    olive: "text-[#7A8864]",
    oliveDark: "text-[#556145]",
    oliveDeep: "text-[#6A7658]",
    stone: "text-[#C8C0B5]",
    ingredientIcon: "text-[#F8F0D7]",
    ingredientIconText: "text-[#333929]",
    champagne: "text-[#E5D5BC]",
    paleGold: "text-[#FAF7F2]",
    addGold: "text-[#FFD64F]",
    addGoldHover: "text-[#EEC642]",
    ivory: "text-[#FAF7F2]",
    nearBlack: "text-[#171717]",
    softGray: "text-[#F5F5F5]",
  },
} as const;

const plannerControlHoverClasses = {
  dark: "hover:bg-white/[0.12]",
  light: "hover:bg-neutral-100",
  paletteLight: "hover:bg-[#FAF7F2]/55",
} as const;

export const siteColorClasses = {
  dark: {
    page: "bg-[#111111] text-neutral-50 before:bg-white/[0.03]",
    header: "border-white/[0.08] bg-white/[0.06]",
    headerForeground: "text-neutral-50",
    nav: "border-white/[0.08] bg-white/[0.04]",
    control:
      "text-neutral-300 hover:border-white/[0.14] hover:bg-white/[0.12] hover:text-neutral-50",
    controlSelected: "border-white/[0.14] bg-white/[0.12] text-neutral-50",
    plannerControl: `border-white/[0.12] bg-white/[0.06] text-white ${plannerControlHoverClasses.dark}`,
    cookbookAddButton:
      "border-white/[0.08] bg-black/50 text-white hover:bg-black/70",
    ingredientThumbnailInteractive: plannerControlHoverClasses.dark,
    plannerDateItem: "bg-white/[0.12]",
    plannerCounter: "border-white/[0.10] bg-white/[0.06] text-white",
    plannerCounterMuted: "text-neutral-300",
    plannerCounterAccent: "text-neutral-50",
    plannerToggle: "border-white/[0.08] bg-black/50",
    plannerToggleSelected: "bg-black text-white",
    plannerToggleIdle: "text-neutral-400 hover:text-white",
    switchTrack: "border-white/[0.14] bg-white/[0.12]",
    switchThumb: "bg-neutral-50 text-[#111111]",
    dayCell: "bg-black/30 text-white",
    mealHeaderCell: "bg-black/30 text-white",
    focus: "focus-visible:outline-white",
  },
  light: {
    page: "bg-white text-neutral-900 before:bg-black/[0.02]",
    header: "border-neutral-200 bg-neutral-50",
    headerForeground: "text-neutral-900",
    nav: "border-neutral-200 bg-neutral-100",
    control:
      "text-neutral-600 hover:border-neutral-300 hover:bg-neutral-200 hover:text-neutral-900",
    controlSelected: "border-neutral-300 bg-neutral-200 text-neutral-900",
    plannerControl: `border-neutral-300 bg-white text-neutral-900 ${plannerControlHoverClasses.light}`,
    cookbookAddButton:
      "border-neutral-300 bg-neutral-200 text-neutral-950 hover:bg-neutral-300",
    ingredientThumbnailInteractive: plannerControlHoverClasses.light,
    plannerDateItem: "bg-neutral-200",
    plannerCounter: "border-neutral-200 bg-neutral-100 text-neutral-900",
    plannerCounterMuted: "text-neutral-500",
    plannerCounterAccent: "text-neutral-950",
    plannerToggle: "border-neutral-300 bg-neutral-200",
    plannerToggleSelected: "bg-neutral-900 text-white",
    plannerToggleIdle: "text-neutral-600 hover:text-neutral-900",
    switchTrack: "border-neutral-300 bg-neutral-200",
    switchThumb: "bg-neutral-900 text-white",
    dayCell: "bg-black/20 text-white",
    mealHeaderCell: "bg-black/20 text-white",
    focus: "focus-visible:outline-neutral-800",
  },
  paletteLight: {
    page: "bg-[#FAF7F2] text-[#7A8864] before:bg-[#A9BDD1]/20",
    header: "border-[#7A8864]/35 bg-[#7A8864]",
    headerForeground: "text-[#FAF7F2]",
    nav: "border-[#C8C0B5] bg-[#FAF7F2]/55",
    control:
      "text-[#FAF7F2] hover:border-[#FAF7F2]/45 hover:bg-[#FAF7F2]/15 hover:text-[#FAF7F2]",
    controlSelected: "border-[#FAF7F2]/70 bg-[#FAF7F2] text-[#7A8864]",
    plannerControl: `border-[#7A8864]/35 bg-[#FAF7F2]/35 text-[#556145] ${plannerControlHoverClasses.paletteLight}`,
    cookbookAddButton:
      "border-[#7A8864]/35 bg-[#FAF7F2] text-[#556145] hover:bg-[#E5D5BC]",
    ingredientThumbnailInteractive: plannerControlHoverClasses.paletteLight,
    plannerDateItem: "bg-[#C8C0B5]/70",
    plannerCounter: "border-[#C8C0B5] bg-[#E5D5BC]/60 text-[#556145]",
    plannerCounterMuted: "text-[#7A8864]",
    plannerCounterAccent: "text-[#556145]",
    plannerToggle: "border-[#7A8864]/35 bg-[#7A8864]",
    plannerToggleSelected: "bg-[#FAF7F2] text-[#556145]",
    plannerToggleIdle: "text-[#FAF7F2]/75 hover:text-[#FAF7F2]",
    switchTrack: "border-[#7A8864]/35 bg-[#556145]",
    switchThumb: "bg-[#FAF7F2] text-[#FFD64F]",
    dayCell: "bg-[#7A8864] text-[#FAF7F2]",
    mealHeaderCell: "bg-[#7A8864] text-[#FAF7F2]",
    focus: "focus-visible:outline-[#7A8864]",
  },
} as const;

export const typographyClasses = {
  app: "font-['Nunito',system-ui,sans-serif]",
  hero: "font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]",
  logo: "translate-x-0 font-['Ubuntu',sans-serif] text-[46px] font-bold leading-none",
  dayLabel: "text-2xl font-extralight tracking-normal",
  mealHeaderLabel: "text-2xl font-extralight tracking-wide",
} as const;

export const layoutClasses = {
  contentWidth:
    "mx-auto w-[min(calc(100%_-_240px),1200px)] max-xl:w-[min(calc(100%_-_160px),1120px)] max-md:w-[calc(100%_-_32px)]",
  calendarGap: "gap-3",
  gridGap: "gap-6",
  controlGap: "gap-4",
  tightControlGap: "gap-2",
} as const;

export const sizeClasses = {
  mealCalendarHeaderHeight: "h-14",
  mealCalendarCellHeight: "h-36",
  modalFormBodyMaxHeight: "max-h-[68vh]",
  plannerPickerBrowserHeight: "h-[44vh]",
  plannerControlHeight: "h-9",
  thumbnailControlWidth: "w-64",
  dayLabelHeight: "h-auto",
  mealSlotPlaceholder: "h-12 w-12",
} as const;

export const radiusClasses = {
  figma6: "rounded-md",
} as const;

export const shadowClasses = {
  subtle: "shadow-sm shadow-black/15",
  raised: "shadow-md shadow-black/15",
  overlay: "shadow-xl",
} as const;

export const surfaceClasses = {
  panel: (theme: SiteTheme) =>
    theme === "dark"
      ? "border-white/[0.10] bg-white/[0.035]"
      : theme === "paletteLight"
        ? "border-[#C8C0B5] bg-[#E5D5BC]/30"
        : "border-neutral-200 bg-neutral-50",
  field: (theme: SiteTheme) =>
    theme === "dark"
      ? "border-white/[0.10] bg-neutral-900 text-neutral-100 focus-visible:outline-white"
      : theme === "paletteLight"
        ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] focus-visible:outline-[#7A8864]"
        : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800",
  modal: (theme: SiteTheme) =>
    theme === "dark"
      ? "border-white/[0.12] bg-neutral-950 text-neutral-100"
      : theme === "paletteLight"
        ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145]"
        : "border-neutral-200 bg-white text-neutral-900",
} as const;

export const thumbnailStyles = {
  recipeShell:
    "relative aspect-square w-full overflow-hidden rounded-md bg-neutral-800 text-left",
  recipeShellInteractive:
    "cursor-pointer transition-transform hover:scale-[1.01]",
  recipeImage: "h-full w-full object-cover",
  recipeImageFallback: "h-full w-full bg-neutral-700",
  recipeImageOverlay: (theme: SiteTheme) =>
    theme === "dark"
      ? "pointer-events-none absolute inset-0 bg-black/20"
      : "hidden",
  recipeTitleBand: (theme: SiteTheme) =>
    theme === "paletteLight" ? "bg-[#7A8864]/95" : "bg-neutral-700/95",
  recipeTitleBandLayout:
    "absolute inset-x-0 bottom-0 flex h-1/4 min-h-14 flex-col justify-center px-3",
  recipeTitle: "truncate text-base font-bold leading-tight text-[#FAF7F2]",
  recipeTitleCompact: "truncate text-sm font-bold leading-tight text-[#FAF7F2]",
  recipeSubtitle: (theme: SiteTheme) =>
    theme === "paletteLight" ? "text-[#FAF7F2]/75" : "text-neutral-300",
  recipeSubtitleLayout: "mt-1 truncate text-xs font-semibold leading-tight",
  recipeSubtitleLayoutCompact:
    "mt-0.5 truncate text-[10px] font-semibold leading-tight",
  ingredientShell: (theme: SiteTheme) =>
    `grid h-7 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-md border px-2 text-left ${shadowClasses.subtle} transition ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.05]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/45"
          : "border-neutral-200 bg-neutral-100"
    }`,
  ingredientSelectedOutline: "outline outline-2 outline-current",
  ingredientSelectedMuted: "opacity-45",
  ingredientDot: "h-2 w-2 rounded-md",
  ingredientContent:
    "grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,45%)] items-center gap-2",
  ingredientName: "min-w-0 truncate text-xs font-semibold leading-tight",
  ingredientBrand:
    "min-w-0 justify-self-end truncate text-right text-[10px] font-semibold leading-tight",
} as const;

const focusBase =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export const controlStyles = {
  modalCloseButton: (theme: SiteTheme) =>
    `inline-flex h-9 items-center justify-center ${radiusClasses.figma6} px-3 text-xs font-bold transition-colors ${focusBase} ${siteColorClasses[theme].focus} ${
      theme === "dark"
        ? "bg-white/[0.08] text-neutral-200 hover:bg-white/[0.14]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC] text-[#556145] hover:bg-[#C8C0B5]"
          : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
  primaryButton: (theme: SiteTheme) =>
    `inline-flex h-12 min-w-32 items-center justify-center ${radiusClasses.figma6} border px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses[theme].focus} ${
      theme === "dark"
        ? "border-white/[0.12] bg-white/[0.14] text-white hover:bg-white/[0.2]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#7A8864] text-[#FAF7F2] hover:bg-[#6A7658]"
          : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700"
    }`,
  secondaryButton: (theme: SiteTheme) =>
    `inline-flex h-12 min-w-28 items-center justify-center ${radiusClasses.figma6} border px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses[theme].focus} ${
      theme === "dark"
        ? "border-white/[0.10] bg-transparent text-neutral-200 hover:bg-white/[0.08]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-transparent text-[#556145] hover:bg-[#E5D5BC]/55"
          : "border-neutral-300 bg-transparent text-neutral-800 hover:bg-neutral-100"
    }`,
  removeButton: (theme: SiteTheme) =>
    `inline-flex h-12 min-w-32 items-center justify-center ${radiusClasses.figma6} border px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses[theme].focus} ${
      theme === "dark"
        ? "border-red-950 bg-red-950 text-white hover:bg-red-900"
        : theme === "paletteLight"
          ? "border-red-950 bg-red-950 text-[#FAF7F2] hover:bg-red-900"
          : "border-red-900 bg-red-900 text-white hover:bg-red-800"
    }`,
  compactSearchInput: (theme: SiteTheme) =>
    `h-9 w-full ${radiusClasses.figma6} border px-3 text-sm font-semibold ${shadowClasses.subtle} outline-none placeholder:text-neutral-500 ${focusBase} ${siteColorClasses[theme].focus} ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-200 text-neutral-900"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145]"
          : "border-neutral-300 bg-white text-neutral-900"
    }`,
  formField: (theme: SiteTheme) =>
    `h-12 rounded-md border px-4 text-base font-normal outline-none placeholder:text-neutral-500 ${focusBase} ${surfaceClasses.field(theme)}`,
  compactTextField: (theme: SiteTheme) =>
    `h-8 min-w-0 rounded-md border px-2 text-xs font-semibold outline-none placeholder:text-neutral-500 disabled:opacity-45 ${focusBase} ${surfaceClasses.field(theme)}`,
  textArea: (theme: SiteTheme) =>
    `min-h-32 resize-y rounded-md border px-4 py-3 text-base font-normal leading-[1.5] outline-none placeholder:text-neutral-500 ${focusBase} ${surfaceClasses.field(theme)}`,
} as const;

export const segmentedToggleStyles = {
  shell: (theme: SiteTheme, widthClass = "w-full") =>
    `${sizeClasses.plannerControlHeight} ${widthClass} inline-flex max-w-full items-center overflow-hidden ${radiusClasses.figma6} border p-1 ${shadowClasses.subtle} ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerToggle}`,
  option: (theme: SiteTheme, selected: boolean) =>
    `flex h-7 min-w-0 flex-1 items-center justify-center ${radiusClasses.figma6} px-3 text-xs font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${
      selected
        ? siteColorClasses[theme].plannerToggleSelected
        : siteColorClasses[theme].plannerToggleIdle
    }`,
} as const;

export const appStyles = {
  shell: (theme: SiteTheme) =>
    `relative min-h-screen overflow-x-clip before:pointer-events-none before:absolute before:inset-0 before:content-[''] ${typographyClasses.app} ${siteColorClasses[theme].page}`,
  overlay: "relative min-h-screen",
  contentBackground: "bg-transparent",
};

export const confirmationDialogStyles = {
  backdrop:
    "fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4",
  panel: (theme: SiteTheme) =>
    `grid w-full max-w-md gap-4 rounded-md border p-6 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  title: "text-xl font-bold leading-tight",
  body: (theme: SiteTheme) =>
    `text-sm font-semibold leading-[1.5] ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  actions: "flex flex-wrap items-center justify-end gap-3",
  cancelButton: controlStyles.secondaryButton,
  confirmButton: (theme: SiteTheme, tone: "danger" | "default") => {
    if (tone === "danger") {
      return controlStyles.removeButton(theme);
    }

    return controlStyles.primaryButton(theme);
  },
} as const;

export const headerStyles = {
  shell: (theme: SiteTheme) =>
    `relative z-10 min-h-20 border-b ${shadowClasses.raised} ${siteColorClasses[theme].header}`,
  inner: `${layoutClasses.contentWidth} grid min-h-20 grid-cols-[1fr_auto_1fr] items-center gap-6 max-md:grid-cols-[1fr_auto] max-md:grid-rows-[auto_auto] max-md:gap-4 max-md:py-4`,
  logo: (theme: SiteTheme) =>
    `justify-self-start border-0 bg-transparent p-0 text-left no-underline ${typographyClasses.logo} ${siteColorClasses[theme].headerForeground}`,
  nav: "flex items-center justify-center gap-2 max-md:col-span-2 max-md:row-start-2 max-md:justify-self-center",
  navButton: (theme: SiteTheme, selected: boolean) =>
    `inline-flex h-16 min-w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border px-3 transition-colors duration-150 ${focusBase} ${siteColorClasses[theme].focus} ${
      selected
        ? siteColorClasses[theme].controlSelected
        : `border-transparent bg-transparent ${siteColorClasses[theme].control}`
    }`,
  icon: "h-8 w-8 fill-current",
  navLabel: "text-xs font-semibold leading-none",
  themeButton: (theme: SiteTheme) =>
    `inline-flex h-8 w-14 cursor-pointer items-center justify-center justify-self-end rounded-md border border-transparent bg-transparent p-0 ${focusBase} ${siteColorClasses[theme].focus}`,
  // Exception to the rectangular control rule: the theme switch keeps the familiar rounded toggle shape.
  themeTrack: (theme: SiteTheme) =>
    `relative h-8 w-14 rounded-full border ${siteColorClasses[theme].switchTrack}`,
  themeThumb: (theme: SiteTheme) =>
    `absolute left-[3px] top-[3px] inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 ${
      theme !== "dark" ? "translate-x-6" : ""
    } ${siteColorClasses[theme].switchThumb}`,
  themeIcon: "h-4 w-4 fill-current",
};

export const pageStyles = {
  shell: `${layoutClasses.contentWidth} relative py-12`,
  showColumnDebugOverlay: false,
  columnDebugOverlay:
    "pointer-events-none absolute inset-y-0 left-0 right-0 grid grid-cols-12 gap-6 opacity-100",
  columnDebugCell: "bg-red-500/10 outline outline-1 outline-red-500/30",
};

export const settingsStyles = {
  shell: "grid max-w-2xl gap-6",
  title: (theme: SiteTheme) =>
    `text-3xl font-bold leading-tight ${theme === "paletteLight" ? "text-[#556145]" : siteColorClasses[theme].plannerCounterAccent}`,
  panel: (theme: SiteTheme) =>
    `grid gap-4 rounded-md border p-6 ${shadowClasses.subtle} ${surfaceClasses.panel(theme)}`,
  panelTitle: "text-xl font-bold leading-tight",
  panelBody: (theme: SiteTheme) =>
    `text-sm font-semibold leading-[1.5] ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-600"
    }`,
  languageOptions: "grid grid-cols-2 gap-3 max-sm:grid-cols-1",
  languageButton: (theme: SiteTheme, selected: boolean) =>
    `grid min-h-20 gap-1 rounded-md border px-4 py-3 text-left transition-colors ${focusBase} ${siteColorClasses[theme].focus} ${
      selected
        ? theme === "dark"
          ? "border-white/[0.18] bg-white/[0.12] text-white"
          : theme === "paletteLight"
            ? "border-[#7A8864]/45 bg-[#FAF7F2] text-[#556145]"
            : "border-neutral-900 bg-neutral-900 text-white"
        : theme === "dark"
          ? "border-white/[0.10] bg-white/[0.04] text-neutral-200 hover:bg-white/[0.08]"
          : theme === "paletteLight"
            ? "border-[#C8C0B5] bg-[#E5D5BC]/35 text-[#556145] hover:bg-[#E5D5BC]/55"
            : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
    }`,
  languageName: "text-base font-bold leading-tight",
  languageCode: "text-xs font-bold uppercase leading-none opacity-60",
} as const;

export const plannerControlsStyles = {
  /* mb-15 so grid starts at same point as cookbook grid */
  shell: `mb-15 mt-3 grid w-full grid-cols-12 ${layoutClasses.gridGap}`,
  datePrimaryRow: `flex w-full items-center justify-center ${layoutClasses.controlGap}`,
  // The year floats above the range label without increasing the top-control row height.
  dateYearRow: (theme: SiteTheme) =>
    `pointer-events-none absolute inset-x-0 -top-4 z-0 flex h-0 justify-center overflow-visible text-sm font-bold leading-none ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  datePrimary: (theme: SiteTheme) =>
    `min-w-52 whitespace-nowrap text-center text-[40px] font-semibold leading-[1.15] ${siteColorClasses[theme].plannerCounterAccent}`,
  leftCell: "col-span-4 flex items-center justify-start",
  centerCell: "relative col-span-4 flex items-center justify-center",
  rightCell: "col-span-4 flex items-center justify-end",
  counterActions: `flex w-full items-center justify-start ${layoutClasses.tightControlGap}`,
  actionSlotLeft: "flex",
  actionSlotCenter: "flex",
  actionSlotRight: "flex",
  iconOnlyButton: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} group relative inline-flex aspect-square items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerControl}`,
  iconButton: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} inline-flex aspect-square items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerControl}`,
  buttonIcon: "h-4 w-4 fill-current",
  tooltip: (theme: SiteTheme) =>
    `pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap ${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold opacity-0 ${shadowClasses.subtle} transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${siteColorClasses[theme].plannerControl}`,
  viewToggle: (theme: SiteTheme) =>
    segmentedToggleStyles.shell(theme, sizeClasses.thumbnailControlWidth),
  viewToggleOption: (theme: SiteTheme, selected: boolean) =>
    segmentedToggleStyles.option(theme, selected),
  statusError: (theme: SiteTheme) =>
    `mb-4 ${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : theme === "paletteLight"
          ? "border-red-700/25 bg-red-700/10 text-red-800"
          : "border-red-200 bg-red-50 text-red-700"
    }`,
};

export const mealCalendarStyles = {
  shell: "flex w-full flex-col overflow-visible",
  grid: `grid w-full min-w-[720px] grid-cols-12 ${layoutClasses.calendarGap}`,
  rows: `flex flex-col ${layoutClasses.calendarGap}`,
  row: "relative min-w-[720px]",
  headerCell: (theme: SiteTheme) =>
    `flex ${sizeClasses.mealCalendarHeaderHeight} items-center justify-center ${radiusClasses.figma6} text-center ${typographyClasses.mealHeaderLabel} ${siteColorClasses[theme].mealHeaderCell}`,
  headerCellSpan: "col-span-4",
  dayCell: (theme: SiteTheme) =>
    `absolute right-full top-0 grid w-20 ${sizeClasses.mealCalendarCellHeight} grid-rows-[1fr_auto_1fr] items-center justify-items-center ${siteColorClasses[theme].plannerCounterAccent}`,
  dayLabel: `${sizeClasses.dayLabelHeight} row-start-2 flex items-center justify-center text-center ${typographyClasses.dayLabel}`,
  // Keeps the date close to the weekday while the weekday remains vertically centered to the meal slots.
  dayDate: (theme: SiteTheme) =>
    `row-start-3 -mt-12 text-sm font-light leading-none ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  mealSlot: (theme: SiteTheme) =>
    `col-span-4 flex ${sizeClasses.mealCalendarCellHeight} items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035] hover:bg-white/[0.06]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/70 hover:bg-[#E5D5BC]/45"
          : "border-neutral-200 bg-white hover:bg-neutral-50"
    }`,
  mealSlotButton: "w-full cursor-pointer text-left",
  mealSlotInner: (theme: SiteTheme) =>
    `${sizeClasses.mealSlotPlaceholder} ${radiusClasses.figma6} border border-dashed ${
      theme === "dark"
        ? "border-white/[0.14]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35"
          : "border-neutral-300"
    }`,
  mealSlotContent:
    "grid h-full w-full grid-cols-2 self-stretch overflow-hidden",
  mealSlotImageFrame: (theme: SiteTheme) =>
    `h-full w-full overflow-hidden rounded-l-md ${
      theme === "dark"
        ? "bg-neutral-800"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45"
          : "bg-neutral-100"
    }`,
  mealSlotImage: "h-full w-full object-cover",
  mealSlotImageFallback: (theme: SiteTheme) =>
    `h-full w-full ${theme === "dark" ? "bg-neutral-800" : theme === "paletteLight" ? "bg-[#E5D5BC]/45" : "bg-neutral-100"}`,
  mealSlotDetails: "grid min-w-0 content-start gap-2 p-3",
  mealSlotTitle: (theme: SiteTheme) =>
    `min-w-0 truncate text-left text-sm font-bold leading-tight ${
      theme === "dark"
        ? "text-neutral-100"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-900"
    }`,
  mealSlotRecipeList: "flex min-w-0 flex-wrap items-start gap-1.5",
  mealSlotRecipe: (theme: SiteTheme) =>
    `max-w-full truncate rounded-md border px-2 py-1 text-[10px] font-bold leading-none ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.08] text-neutral-100"
        : theme === "paletteLight"
          ? "border-[#7A8864]/25 bg-[#E5D5BC]/55 text-[#556145]"
          : "border-neutral-200 bg-neutral-100 text-neutral-800"
    }`,
  mealSlotStatus: (theme: SiteTheme) =>
    `text-center text-xs font-bold ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  monthGrid: `grid min-w-[840px] grid-cols-7 ${layoutClasses.calendarGap}`,
  monthGridWithOffset: `grid min-w-[840px] grid-cols-7 ${layoutClasses.calendarGap} mt-3`,
  monthHeaderCell: (theme: SiteTheme) =>
    `flex h-9 items-center justify-center ${radiusClasses.figma6} text-center text-xs font-bold uppercase ${
      theme === "dark"
        ? "bg-black/30 text-white"
        : theme === "paletteLight"
          ? "bg-[#7A8864] text-[#FAF7F2]"
          : "bg-black/20 text-white"
    }`,
  monthDayCell: (theme: SiteTheme, muted: boolean) =>
    `min-h-32 ${radiusClasses.figma6} border p-2 transition-colors duration-150 ${
      muted
        ? theme === "dark"
          ? "border-white/[0.05] bg-white/[0.018]"
          : theme === "paletteLight"
            ? "border-[#C8C0B5]/60 bg-[#FAF7F2]/40"
            : "border-neutral-200/70 bg-neutral-50"
        : theme === "dark"
          ? "border-white/[0.08] bg-white/[0.035]"
          : theme === "paletteLight"
            ? "border-[#C8C0B5] bg-[#FAF7F2]/70"
            : "border-neutral-200 bg-white"
    }`,
  monthDayNumber: (theme: SiteTheme, muted: boolean) =>
    `text-xs font-bold ${
      muted
        ? theme === "dark"
          ? "text-neutral-600"
          : theme === "paletteLight"
            ? "text-[#7A8864]/60"
            : "text-neutral-400"
        : theme === "dark"
          ? "text-neutral-300"
          : theme === "paletteLight"
            ? "text-[#556145]"
            : "text-neutral-700"
    }`,
  monthDayMeals: "mt-2 grid gap-1",
  monthMealPill: (theme: SiteTheme, empty: boolean) =>
    `min-w-0 truncate whitespace-nowrap text-left ${radiusClasses.figma6} border px-2 py-1 text-[10px] font-bold transition-colors ${
      empty
        ? theme === "dark"
          ? "border-white/[0.08] bg-transparent text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200"
          : theme === "paletteLight"
            ? "border-[#7A8864]/20 bg-transparent text-[#7A8864]/70 hover:bg-[#E5D5BC]/45 hover:text-[#556145]"
            : "border-neutral-200 bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        : theme === "dark"
          ? "border-white/[0.08] bg-white/[0.08] text-neutral-100 hover:bg-white/[0.12]"
          : theme === "paletteLight"
            ? "border-[#7A8864]/20 bg-[#E5D5BC]/55 text-[#556145] hover:bg-[#E5D5BC]/75"
            : "border-neutral-200 bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
};

export const plannerPickerStyles = {
  modalBackdrop:
    "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4",
  modalPanel: (theme: SiteTheme) =>
    `max-h-[calc(100vh_-_48px)] w-full max-w-5xl overflow-y-auto ${radiusClasses.figma6} border p-6 ${shadowClasses.overlay} ${
      theme === "dark"
        ? "border-white/[0.12] bg-neutral-950 text-neutral-100"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145]"
          : "border-neutral-200 bg-white text-neutral-900"
    }`,
  header: "flex flex-wrap items-start justify-between gap-4",
  title: "text-2xl font-bold leading-tight",
  subtitle: (theme: SiteTheme) =>
    `mt-1 text-sm font-semibold leading-[1.45] ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  closeButton: controlStyles.modalCloseButton,
  controls:
    "mt-4 grid grid-cols-[13rem_auto_minmax(0,1fr)_auto] items-start gap-3 max-md:grid-cols-[13rem_auto_minmax(0,1fr)] max-sm:grid-cols-[minmax(0,1fr)_auto]",
  searchInput: controlStyles.compactSearchInput,
  phaseBadge: (theme: SiteTheme) =>
    `inline-flex h-9 items-center justify-center ${radiusClasses.figma6} border px-3 text-xs font-bold max-sm:col-span-2 ${siteColorClasses[theme].plannerControl}`,
  ingredientFilterChips:
    "flex min-h-9 flex-wrap items-start gap-2 max-sm:col-span-2",
  emptyIngredientChipSlot: "min-h-9 max-sm:hidden",
  selectedSection: "mt-4 border-t pt-4",
  selectedSectionBorder: (theme: SiteTheme) =>
    theme === "dark"
      ? "border-white/[0.10]"
      : theme === "paletteLight"
        ? "border-[#C8C0B5]"
        : "border-neutral-200",
  selectedStrip: "grid grid-cols-2 content-start gap-2 max-sm:grid-cols-1",
  selectedMainGrid:
    "grid grid-cols-[9rem_minmax(12rem,22rem)] items-start gap-3 max-sm:grid-cols-1",
  selectedMainThumbnail: "h-36 w-36",
  selectedItem: (theme: SiteTheme) =>
    `inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-bold ${siteColorClasses[theme].plannerControl}`,
  bodyGrid: `mt-4 grid ${sizeClasses.plannerPickerBrowserHeight} grid-cols-[13rem_minmax(0,1fr)] gap-3 overflow-y-auto pr-1 max-lg:grid-cols-1`,
  filterRail: (theme: SiteTheme) =>
    `rounded-md p-3 ${shadowClasses.subtle} ${
      theme === "dark"
        ? "bg-white/[0.04]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45"
          : "bg-neutral-100"
    }`,
  recipeGrid:
    "grid grid-cols-4 gap-3 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1",
  recipeCard: (theme: SiteTheme, selected: boolean) =>
    `${shadowClasses.subtle} ${
      selected
        ? theme === "dark"
          ? "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-md after:ring-2 after:ring-inset after:ring-white after:content-['']"
          : theme === "paletteLight"
            ? "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-md after:ring-2 after:ring-inset after:ring-[#7A8864] after:content-['']"
            : "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-md after:ring-2 after:ring-inset after:ring-neutral-900 after:content-['']"
        : theme === "dark"
          ? "ring-1 ring-white/[0.08]"
          : theme === "paletteLight"
            ? "ring-1 ring-[#7A8864]/20"
            : "ring-1 ring-neutral-200"
    }`,
  footer: "mt-6 flex flex-wrap items-center justify-end gap-3",
  secondaryButton: controlStyles.secondaryButton,
  primaryButton: controlStyles.primaryButton,
  removeButton: controlStyles.removeButton,
  emptyState: (theme: SiteTheme) =>
    `flex min-h-72 items-center justify-center ${radiusClasses.figma6} border p-8 text-center text-sm font-bold ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035] text-neutral-300"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/70 text-[#556145]"
          : "border-neutral-200 bg-neutral-50 text-neutral-700"
    }`,
  statusError: (theme: SiteTheme) =>
    `${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : theme === "paletteLight"
          ? "border-red-700/25 bg-red-700/10 text-red-800"
          : "border-red-200 bg-red-50 text-red-700"
    }`,
  statusErrorWithOffset: (theme: SiteTheme) =>
    `mt-4 ${plannerPickerStyles.statusError(theme)}`,
};
