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
    fixedHeader: "max-md:border-white/[0.14] max-md:bg-neutral-950/95",
    nav: "border-white/[0.08] bg-white/[0.04]",
    bottomNav: "max-md:border-white/[0.14] max-md:bg-neutral-950/95",
    control:
      "border-white/[0.08] bg-white/[0.055] text-neutral-300 hover:border-white/[0.16] hover:bg-white/[0.14] hover:text-neutral-50 max-md:border-white/[0.16] max-md:bg-neutral-800 max-md:text-neutral-100",
    controlSelected:
      "border-white/[0.18] bg-white/[0.18] text-neutral-50 max-md:border-white/[0.24] max-md:bg-neutral-700",
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
    fixedHeader: "max-md:border-neutral-300 max-md:bg-neutral-50",
    nav: "border-neutral-200 bg-neutral-100",
    bottomNav: "max-md:border-neutral-300 max-md:bg-neutral-50",
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
    fixedHeader: "max-md:border-[#7A8864]/35 max-md:bg-[#7A8864]",
    nav: "border-[#C8C0B5] bg-[#FAF7F2]/55",
    bottomNav: "max-md:border-[#7A8864]/35 max-md:bg-[#7A8864]",
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
  logo: "translate-x-0 font-['Ubuntu',sans-serif] text-[46px] font-bold leading-none max-sm:text-[34px]",
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

export const responsiveClasses = {
  mobilePagePadding: "max-md:py-8 max-sm:py-6",
  mobileStack: "max-md:grid-cols-1 max-md:gap-4",
  mobileToolbarWrap: "max-md:flex-wrap max-md:justify-start max-sm:w-full",
  mobileModalBackdrop: "max-sm:p-3",
  mobileModalPanel: "max-sm:max-h-[calc(100vh_-_16px)] max-sm:p-4",
  mobileTouchTarget: "max-sm:min-h-10",
} as const;

export const sizeClasses = {
  mealCalendarHeaderHeight: "h-14",
  mealCalendarCellHeight: "h-36",
  mealSlotContentInset: "h-[calc(100%_-_16px)] w-[calc(100%_-_16px)]",
  mobileFixedHeaderOffset: "max-md:pt-16",
  mobileBottomNavOffset: "max-md:pb-36",
  modalOuterMaxHeight: "max-h-[88vh]",
  modalFormBodyMaxHeight: "max-h-[56vh]",
  modalFormBodyMobileMaxHeight: "max-sm:max-h-[52vh]",
  plannerPickerBrowserHeight: "h-[44vh]",
  plannerControlHeight: "h-9",
  thumbnailControlWidth: "w-64",
  dayLabelHeight: "h-auto",
  mealSlotPlaceholder: "h-12 w-12",
  viewportModalMaxHeight: "max-h-[calc(100vh_-_48px)]",
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

export const modalLayoutClasses = {
  centeredBackdrop: `fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
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
        ? "border-white/[0.16] bg-white/[0.18]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/45"
          : "border-neutral-200 bg-neutral-100"
    }`,
  ingredientSelectedOutline: "outline outline-2 outline-current",
  ingredientSelectedColorBorder: "border-2",
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
    `${sizeClasses.plannerControlHeight} ${widthClass} flex max-w-full items-center overflow-hidden ${radiusClasses.figma6} border p-1 ${shadowClasses.subtle} ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerToggle}`,
  option: (theme: SiteTheme, selected: boolean) =>
    `flex h-7 min-w-0 flex-1 items-center justify-center ${radiusClasses.figma6} px-3 text-xs font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${
      selected
        ? siteColorClasses[theme].plannerToggleSelected
        : siteColorClasses[theme].plannerToggleIdle
    }`,
} as const;

export const appStyles = {
  shell: (theme: SiteTheme) =>
    `relative min-h-screen overflow-x-clip before:pointer-events-none before:absolute before:inset-0 before:content-[''] ${sizeClasses.mobileFixedHeaderOffset} ${typographyClasses.app} ${siteColorClasses[theme].page}`,
  overlay: "relative min-h-screen",
  contentBackground: "bg-transparent",
};

export const headerStyles = {
  shell: (theme: SiteTheme) =>
    `relative z-10 border-b max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-[60] ${shadowClasses.raised} ${siteColorClasses[theme].header} ${siteColorClasses[theme].fixedHeader}`,
  inner: `${layoutClasses.contentWidth} grid min-h-20 grid-cols-[1fr_auto_1fr] items-center gap-6 py-0 max-md:min-h-0 max-md:grid-cols-[1fr_auto] max-md:gap-x-4 max-md:py-3 max-sm:py-3`,
  logo: (theme: SiteTheme) =>
    `justify-self-start border-0 bg-transparent p-0 text-left no-underline ${typographyClasses.logo} ${siteColorClasses[theme].headerForeground}`,
  nav: (theme: SiteTheme) =>
    `flex items-center justify-center gap-2 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:border-t max-md:px-4 max-md:pt-2 max-md:[padding-bottom:calc(0.5rem+env(safe-area-inset-bottom))] ${siteColorClasses[theme].header} ${siteColorClasses[theme].bottomNav}`,
  navButton: (theme: SiteTheme, selected: boolean) =>
    `inline-flex h-16 min-w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border px-3 transition-colors duration-150 max-md:h-14 max-md:min-w-0 max-md:flex-1 max-md:px-2 ${focusBase} ${siteColorClasses[theme].focus} ${
      selected
        ? siteColorClasses[theme].controlSelected
        : siteColorClasses[theme].control
    }`,
  icon: "h-8 w-8 fill-current max-md:h-5 max-md:w-5",
  navLabel: "text-xs font-semibold leading-none max-sm:text-[11px]",
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
  shell: `${layoutClasses.contentWidth} ${responsiveClasses.mobilePagePadding} ${sizeClasses.mobileBottomNavOffset} relative py-12`,
  showColumnDebugOverlay: false,
  columnDebugOverlay:
    "pointer-events-none absolute inset-y-0 left-0 right-0 grid grid-cols-12 gap-6 opacity-100",
  columnDebugCell: "bg-red-500/10 outline outline-1 outline-red-500/30",
};

export const settingsStyles = {
  shell: "mx-auto grid w-full max-w-2xl gap-6",
  quickSettingsRow: "flex flex-wrap items-start justify-between gap-4",
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
  languagePanel: (theme: SiteTheme) =>
    `flex w-fit flex-wrap items-center gap-4 rounded-md border p-2 ${shadowClasses.subtle} ${surfaceClasses.panel(theme)}`,
  languagePanelTitle: "pl-2 text-sm font-bold leading-tight",
  languageOptions: "flex items-center gap-2",
  languageButton: (theme: SiteTheme, selected: boolean) =>
    `inline-flex h-10 min-w-20 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition-colors ${focusBase} ${siteColorClasses[theme].focus} ${
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
  languageFlag: "text-base leading-none",
  languageCode: "text-xs font-extrabold uppercase leading-none",
  form: "grid gap-4",
  formGrid: "grid grid-cols-2 gap-4 max-sm:grid-cols-1",
  fieldGroup: "grid gap-2",
  label: "text-sm font-bold leading-tight",
  buttonGroup: "flex flex-wrap items-center gap-2",
  textInput: controlStyles.formField,
  selectInput: controlStyles.formField,
  helpText: (theme: SiteTheme) =>
    `text-xs font-semibold leading-[1.45] ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  statusRow: "flex flex-wrap items-center justify-between gap-4",
  statusText: (theme: SiteTheme, tone: "error" | "success") =>
    `text-sm font-bold ${
      tone === "error"
        ? theme === "dark"
          ? "text-red-200"
          : "text-red-700"
        : theme === "dark"
          ? "text-emerald-200"
          : theme === "paletteLight"
            ? "text-[#556145]"
            : "text-emerald-700"
    }`,
  saveButton: controlStyles.primaryButton,
  secondaryButton: controlStyles.secondaryButton,
  currentProviderCard: (theme: SiteTheme) =>
    `flex w-fit flex-wrap items-center gap-4 rounded-md border p-2 ${shadowClasses.subtle} ${surfaceClasses.panel(theme)}`,
  currentProviderTitle: "text-sm font-bold leading-tight",
  currentProviderDetails: "flex flex-wrap items-center gap-2",
  currentProviderItem: (theme: SiteTheme) =>
    `min-w-0 rounded-md border px-3 py-1.5 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.04]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/55"
          : "border-neutral-200 bg-white"
    }`,
  currentProviderLabel:
    "text-[10px] font-extrabold uppercase leading-tight opacity-60",
  currentProviderValue:
    "mt-0.5 min-w-0 truncate text-sm font-bold leading-tight",
  systemGrid: "grid gap-4",
  systemRow: (theme: SiteTheme) =>
    `grid grid-cols-[10rem_minmax(0,1fr)] gap-4 rounded-md border px-4 py-2 text-sm max-sm:grid-cols-1 ${surfaceClasses.field(theme)}`,
  systemLabel: "font-bold",
  systemValue: "min-w-0 break-words font-semibold opacity-80",
} as const;

export const plannerControlsStyles = {
  /* Keep the planner content aligned with the cookbook grid using the shared spacing scale. */
  shell: `mb-8 mt-3 grid w-full grid-cols-12 ${layoutClasses.gridGap} max-md:mb-4 max-md:grid-cols-1 max-md:gap-3`,
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
    `min-w-52 whitespace-nowrap text-center text-[40px] font-semibold leading-[1.15] max-md:min-w-0 max-md:text-[34px] max-sm:text-[32px] ${siteColorClasses[theme].plannerCounterAccent}`,
  leftCell: "order-2 col-span-8 flex items-center justify-start max-md:hidden",
  centerCell:
    "relative order-1 col-span-12 flex items-center justify-center max-md:col-span-1 max-md:min-w-0",
  rightCell: "order-2 col-span-4 flex items-center justify-end max-md:hidden",
  counterActions: `grid w-full grid-cols-4 ${layoutClasses.calendarGap}`,
  actionSlotLeft: "min-w-0",
  actionSlotCenter: "min-w-0",
  actionSlotRight: "min-w-0",
  iconOnlyButton: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} group relative inline-flex w-full min-w-0 items-center justify-center gap-2 ${radiusClasses.figma6} border px-3 text-sm font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 max-sm:gap-1 max-sm:px-1.5 max-sm:text-xs ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerControl}`,
  iconButton: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} inline-flex aspect-square items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerControl}`,
  buttonIcon: "h-4 w-4 shrink-0 fill-current",
  actionButtonLabel: "min-w-0 truncate leading-none",
  tooltip: (theme: SiteTheme) =>
    `pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap ${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold opacity-0 ${shadowClasses.subtle} transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${siteColorClasses[theme].plannerControl}`,
  viewToggle: (theme: SiteTheme) =>
    segmentedToggleStyles.shell(theme, sizeClasses.thumbnailControlWidth),
  viewToggleOption: (theme: SiteTheme, selected: boolean) =>
    segmentedToggleStyles.option(theme, selected),
  mobileControlRow: `hidden w-full grid-cols-2 ${layoutClasses.calendarGap} max-md:order-2 max-md:mt-4 max-md:grid`,
  mobileControlPlaceholder: "hidden max-md:block",
  mobileControlButton: (theme: SiteTheme, selected = false) =>
    `${sizeClasses.plannerControlHeight} inline-flex min-w-0 items-center justify-center gap-2 ${radiusClasses.figma6} border px-3 text-sm font-bold ${shadowClasses.subtle} transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses[theme].focus} ${
      selected
        ? siteColorClasses[theme].plannerToggleSelected
        : siteColorClasses[theme].plannerControl
    }`,
  mobileActionsBackdrop:
    "fixed inset-0 z-50 hidden items-center justify-center bg-black/35 p-4 max-md:flex",
  mobileActionsPanel: (theme: SiteTheme) =>
    `grid w-full max-w-xs grid-rows-[auto_minmax(0,1fr)] gap-3 ${radiusClasses.figma6} border p-4 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  mobileActionsHeader: "flex items-center justify-between gap-3",
  mobileActionsTitle: "text-lg font-bold leading-tight",
  mobileActionsCloseButton: controlStyles.modalCloseButton,
  mobileActionsBody: "grid min-h-0 gap-2",
  statusError: (theme: SiteTheme) =>
    `mb-4 ${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : theme === "paletteLight"
          ? "border-red-700/25 bg-red-700/10 text-red-800"
          : "border-red-200 bg-red-50 text-red-700"
    }`,
};

export const prepHelperStyles = {
  modalBackdrop: modalLayoutClasses.centeredBackdrop,
  modalPanel: (theme: SiteTheme) =>
    `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-6 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  header: "flex items-start justify-between gap-4",
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
  bodyFrame: "grid min-h-0 gap-3",
  list: "grid max-h-[48vh] gap-3 overflow-y-auto pr-1",
  item: (theme: SiteTheme) =>
    `grid gap-2 rounded-md border p-3 ${shadowClasses.subtle} ${surfaceClasses.panel(theme)}`,
  itemHeader: "flex flex-wrap items-start justify-between gap-3",
  itemName: "text-base font-bold leading-tight",
  itemAmount: "whitespace-nowrap text-sm font-extrabold",
  actionList: "flex flex-wrap gap-2",
  actionChip: (theme: SiteTheme) =>
    `rounded-md border px-2 py-1 text-xs font-bold ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.08] text-neutral-100"
        : theme === "paletteLight"
          ? "border-[#7A8864]/25 bg-[#E5D5BC]/55 text-[#556145]"
          : "border-neutral-200 bg-neutral-100 text-neutral-800"
    }`,
  sourceText: (theme: SiteTheme) =>
    `text-xs font-semibold leading-tight ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  emptyState: (theme: SiteTheme) =>
    `rounded-md border p-6 text-center text-sm font-bold ${surfaceClasses.panel(theme)}`,
  footer: "flex items-center justify-end border-t pt-4",
  secondaryButton: controlStyles.secondaryButton,
} as const;

export const mealCalendarStyles = {
  shell: "flex w-full flex-col overflow-visible max-md:overflow-x-auto",
  grid: `grid w-full min-w-[720px] grid-cols-12 ${layoutClasses.calendarGap} max-md:min-w-0 max-md:grid-cols-1`,
  rows: `flex flex-col ${layoutClasses.calendarGap}`,
  row: `relative min-h-36 min-w-[720px] max-md:grid max-md:min-h-0 max-md:min-w-0 max-md:gap-2`,
  headerCell: (theme: SiteTheme) =>
    `flex ${sizeClasses.mealCalendarHeaderHeight} items-center justify-center ${radiusClasses.figma6} text-center ${typographyClasses.mealHeaderLabel} ${siteColorClasses[theme].mealHeaderCell}`,
  headerCellSpan: "col-span-4",
  dayCell: (theme: SiteTheme) =>
    `absolute right-full top-0 grid w-20 ${sizeClasses.mealCalendarCellHeight} grid-rows-[1fr_auto_auto_1fr] items-center justify-items-center border-0 bg-transparent p-0 max-md:static max-md:h-auto max-md:w-full max-md:grid-cols-[minmax(0,1fr)_auto] max-md:grid-rows-none max-md:justify-start max-md:justify-items-stretch max-md:gap-x-2 max-md:py-1 ${siteColorClasses[theme].plannerCounterAccent}`,
  dayCellButton: (theme: SiteTheme) =>
    `${mealCalendarStyles.dayCell(theme)} cursor-pointer transition-opacity hover:opacity-80 ${focusBase} ${siteColorClasses[theme].focus}`,
  dayTitleGroup:
    "row-start-2 flex items-center justify-center gap-1 max-md:row-auto",
  dayHeaderTextGroup:
    "grid min-w-0 items-center justify-self-start justify-items-start max-md:flex max-md:items-center max-md:gap-1.5",
  dayToggleIcon: (collapsed: boolean) =>
    `flex h-5 w-5 items-center justify-center transition-transform ${
      collapsed ? "" : "rotate-90"
    }`,
  dayToggleSvg: "h-3.5 w-3.5 fill-current",
  dayLabel: `${sizeClasses.dayLabelHeight} flex items-center justify-center text-center ${typographyClasses.dayLabel}`,
  // Keeps the date close to the weekday while the weekday remains vertically centered to the meal slots.
  dayDate: (theme: SiteTheme) =>
    `row-start-3 mt-1 text-sm font-light leading-none max-md:row-auto max-md:mt-0 ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  dayPreviewStrip: "hidden items-center justify-self-end gap-1.5 max-md:flex",
  dayPreviewFilled: (theme: SiteTheme) =>
    `block h-7 w-7 overflow-hidden ${radiusClasses.figma6} border ${shadowClasses.subtle} ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.035]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/70"
          : "border-neutral-200 bg-white"
    }`,
  dayPreviewEmpty: (theme: SiteTheme) =>
    `block h-7 w-7 ${radiusClasses.figma6} border border-dashed ${
      theme === "dark"
        ? "border-white/[0.14] bg-white/[0.035]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#FAF7F2]/70"
          : "border-neutral-300 bg-white"
    }`,
  dayPreviewImage: "h-full w-full object-cover",
  dayPreviewImageFallback: (theme: SiteTheme) =>
    `block h-full w-full ${theme === "dark" ? "bg-neutral-800" : theme === "paletteLight" ? "bg-[#E5D5BC]/45" : "bg-neutral-100"}`,
  dayMealGrid: (collapsed: boolean) =>
    `${mealCalendarStyles.grid} ${collapsed ? "hidden" : ""}`,
  mealSlot: (theme: SiteTheme) =>
    `col-span-4 flex ${sizeClasses.mealCalendarCellHeight} items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 max-md:col-span-1 max-md:h-32 max-sm:h-28 ${
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
  mealSlotContent: `grid ${sizeClasses.mealSlotContentInset} grid-cols-2 overflow-hidden ${radiusClasses.figma6}`,
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
  mealSlotDetails:
    "grid min-w-0 content-start gap-2 px-3 pb-3 pt-2 max-sm:px-2 max-sm:pb-2 max-sm:pt-1.5",
  mealSlotTitle: (theme: SiteTheme) =>
    `min-w-0 whitespace-normal break-words text-left text-base font-bold leading-tight max-sm:text-sm ${
      theme === "dark"
        ? "text-neutral-100"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-900"
    }`,
  mealSlotRecipeList: "flex min-w-0 flex-wrap items-start gap-1.5",
  mealSlotRecipe: (theme: SiteTheme) =>
    `max-w-full truncate rounded-md border px-2 py-1 text-xs font-bold leading-none max-sm:text-[11px] ${
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
    `min-h-32 ${radiusClasses.figma6} border p-2 transition-colors duration-150 max-sm:min-h-28 ${
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
  modalBackdrop: modalLayoutClasses.centeredBackdrop,
  modalPanel: (theme: SiteTheme) =>
    `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-6 ${shadowClasses.overlay} ${
      theme === "dark"
        ? "border-white/[0.12] bg-neutral-950 text-neutral-100"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145]"
          : "border-neutral-200 bg-white text-neutral-900"
    }`,
  header: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4",
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
  bodyFrame: "grid min-h-0 gap-4 overflow-y-auto pr-1",
  controls:
    "mt-4 grid grid-cols-[13rem_auto_auto_minmax(0,1fr)] items-start gap-3 max-md:grid-cols-[13rem_auto_auto_minmax(0,1fr)] max-sm:grid-cols-[minmax(0,1fr)_auto_auto]",
  searchInput: controlStyles.compactSearchInput,
  categoryButton: (theme: SiteTheme) =>
    `inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-extrabold ${shadowClasses.subtle} transition-colors ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-500 text-neutral-950 hover:bg-neutral-400"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#C8C0B5] text-[#556145] hover:bg-[#A9BDD1]/40"
          : "border-neutral-300 bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
    }`,
  ingredientFilterChips:
    "flex min-h-9 flex-wrap items-start gap-2 max-sm:col-span-3",
  emptyIngredientChipSlot: "min-h-9 max-sm:hidden",
  selectedSection: "mt-4 border-t pt-4 max-sm:hidden",
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
  bodyGrid: `mt-4 grid ${sizeClasses.plannerPickerBrowserHeight} overflow-y-auto pr-1`,
  filterRail: (theme: SiteTheme) =>
    `max-h-[52vh] overflow-y-auto rounded-md p-3 max-sm:max-h-[44vh] ${shadowClasses.subtle} ${
      theme === "dark"
        ? "bg-white/[0.04]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45"
          : "bg-neutral-100"
    }`,
  recipeGrid: "grid grid-cols-4 gap-3 max-xl:grid-cols-3 max-md:grid-cols-2",
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

export const groceryExportStyles = {
  modalBackdrop: modalLayoutClasses.centeredBackdrop,
  modalPanel: (theme: SiteTheme) =>
    `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-6 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  header: "flex items-start justify-between gap-4",
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
  bodyFrame: "grid min-h-0 gap-3",
  list: "grid max-h-[44vh] gap-4 overflow-y-auto pr-1",
  section: (theme: SiteTheme) =>
    `grid gap-2 rounded-md border p-3 ${shadowClasses.subtle} ${surfaceClasses.panel(theme)}`,
  sectionTitle: (theme: SiteTheme) =>
    `text-xs font-extrabold uppercase leading-tight ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  itemButton: (theme: SiteTheme, selected: boolean) =>
    `grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${focusBase} ${siteColorClasses[theme].focus} ${
      selected
        ? siteColorClasses[theme].plannerControl
        : theme === "dark"
          ? "border-white/[0.08] bg-transparent text-neutral-500"
          : theme === "paletteLight"
            ? "border-[#7A8864]/20 bg-transparent text-[#7A8864]/55"
            : "border-neutral-200 bg-transparent text-neutral-500"
    }`,
  checkbox: (theme: SiteTheme, selected: boolean) =>
    `inline-flex h-5 w-5 items-center justify-center rounded-sm border text-xs font-bold ${
      selected
        ? theme === "dark"
          ? "border-white bg-white text-neutral-950"
          : theme === "paletteLight"
            ? "border-[#7A8864] bg-[#7A8864] text-[#FAF7F2]"
            : "border-neutral-900 bg-neutral-900 text-white"
        : theme === "dark"
          ? "border-white/[0.18] text-transparent"
          : theme === "paletteLight"
            ? "border-[#7A8864]/35 text-transparent"
            : "border-neutral-300 text-transparent"
    }`,
  itemText: "min-w-0",
  itemName: "truncate text-sm font-bold leading-tight",
  itemSources: (theme: SiteTheme) =>
    `mt-0 block truncate text-xs font-semibold leading-tight ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  itemAmount: "whitespace-nowrap text-xs font-extrabold",
  emptyState: (theme: SiteTheme) =>
    `rounded-md border p-6 text-center text-sm font-bold ${surfaceClasses.panel(theme)}`,
  statusError: plannerPickerStyles.statusError,
  statusSuccess: (theme: SiteTheme) =>
    `${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
        : theme === "paletteLight"
          ? "border-[#7A8864]/30 bg-[#7A8864]/10 text-[#556145]"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
    }`,
  footer: "flex flex-wrap items-center justify-between gap-4 border-t pt-4",
  countText: (theme: SiteTheme) =>
    `text-sm font-bold ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  actionGroup: "flex flex-wrap items-center justify-end gap-4",
  secondaryButton: controlStyles.secondaryButton,
  primaryButton: controlStyles.primaryButton,
};
