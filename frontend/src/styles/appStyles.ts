/** Set as data-theme on the app shell; styles follow it with the dark: and light: variants (see index.css). */
export type SiteTheme = "dark" | "light";

// Contrast (WCAG): #7A8864 is 3.55:1 on #FAF7F2, so it is kept for borders and accents. Text in the
// light theme uses oliveDark (#556145, 6.18:1 on #FAF7F2, 4.58:1 on champagne), and olive surfaces that
// carry ivory text use oliveSurface (#64714F, 4.89:1). See styles/contrast.test.ts.
export const colorPalette = {
  dustyBlue: "#A9BDD1",
  olive: "#7A8864",
  oliveSurface: "#64714F",
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
    oliveSurface: "bg-[#64714F]",
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
    oliveSurface: "border-[#64714F]",
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
    oliveSurface: "text-[#64714F]",
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

export const siteColorClasses = {
  // A bar that stays under the fixed header on narrow screens, in the page colour.
  stickyBar:
    "max-[1100px]:bg-[#EAEBEB]/95 max-[1100px]:backdrop-blur-sm dark:max-[1100px]:bg-[#181818]/95",
  page:
    "bg-[#FAF7F2] text-[#556145] before:bg-[#A9BDD1]/20 dark:bg-[#111111] dark:text-neutral-50 dark:before:bg-white/[0.03]",
  header:
    "border-[#7A8864]/35 bg-[#64714F] dark:border-white/[0.08] dark:bg-white/[0.06]",
  headerForeground:
    "text-[#FAF7F2] dark:text-neutral-50",
  fixedHeader:
    "max-[1100px]:border-[#7A8864]/35 max-[1100px]:bg-[#64714F] dark:max-[1100px]:border-white/[0.14] dark:max-[1100px]:bg-neutral-950/95",
  nav:
    "border-[#C8C0B5] bg-[#FAF7F2]/55 dark:border-white/[0.08] dark:bg-white/[0.04]",
  bottomNav:
    "max-[1100px]:border-[#7A8864]/35 max-[1100px]:bg-[#64714F] dark:max-[1100px]:border-white/[0.14] dark:max-[1100px]:bg-neutral-950/95",
  control:
    "text-[#FAF7F2] hover:border-[#FAF7F2]/45 hover:bg-[#FAF7F2]/15 hover:text-[#FAF7F2] dark:border-white/[0.08] dark:bg-white/[0.055] dark:text-neutral-300 dark:hover:border-white/[0.16] dark:hover:bg-white/[0.14] dark:hover:text-neutral-50 dark:max-[1100px]:border-white/[0.16] dark:max-[1100px]:bg-neutral-800 dark:max-[1100px]:text-neutral-100",
  controlSelected:
    "border-[#FAF7F2]/70 bg-[#FAF7F2] text-[#556145] dark:border-white/[0.18] dark:bg-white/[0.18] dark:text-neutral-50 dark:max-[1100px]:border-white/[0.24] dark:max-[1100px]:bg-neutral-700",
  plannerControl:
    "border-[#7A8864]/35 bg-[#FAF7F2]/35 text-[#556145] hover:bg-[#FAF7F2]/55 dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.12]",
  plannerTooltip:
    "border-[#7A8864] bg-[#FAF7F2] text-[#556145] dark:border-white/[0.18] dark:bg-neutral-950 dark:text-white",
  cookbookFilterButton:
    "border-[#7A8864]/35 bg-[#FAF7F2] text-[#556145] hover:bg-[#E5D5BC] dark:border-white/[0.12] dark:bg-neutral-400 dark:text-neutral-950 dark:hover:bg-neutral-300",
  cookbookAddButton:
    "border-[#7A8864] bg-[#FAF7F2] text-[#556145] hover:bg-[#E5D5BC] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-900",
  ingredientThumbnailInteractive:
    "hover:bg-[#FAF7F2]/55 dark:hover:bg-white/[0.12]",
  selectedThumbnailBorder:
    "border-[#9BCB4F] dark:border-[#B8F07A]",
  selectedThumbnailRing:
    "after:ring-[#9BCB4F] dark:after:ring-[#B8F07A]",
  plannerDateItem:
    "bg-[#C8C0B5]/70 dark:bg-white/[0.12]",
  plannerCounter:
    "border-[#C8C0B5] bg-[#E5D5BC]/60 text-[#556145] dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-white",
  plannerCounterMuted:
    "text-[#556145] dark:text-neutral-300",
  plannerCounterAccent:
    "text-[#556145] dark:text-neutral-50",
  plannerToggle:
    "border-[#7A8864]/35 bg-[#64714F] dark:border-white/[0.08] dark:bg-black/50",
  plannerToggleSelected:
    "bg-[#FAF7F2] text-[#556145] dark:bg-black dark:text-white",
  plannerToggleIdle:
    "text-[#FAF7F2] hover:text-[#FAF7F2] dark:text-neutral-400 dark:hover:text-white",
  switchTrack:
    "border-[#7A8864]/35 bg-[#556145] dark:border-white/[0.14] dark:bg-white/[0.12]",
  switchThumb:
    "bg-[#FAF7F2] text-[#FFD64F] dark:bg-neutral-50 dark:text-[#111111]",
  dayCell:
    "bg-[#64714F] text-[#FAF7F2] dark:bg-black/30 dark:text-white",
  mealHeaderCell:
    "bg-[#64714F] text-[#FAF7F2] dark:bg-black/30 dark:text-white",
  focus:
    "focus-visible:outline-[#7A8864] dark:focus-visible:outline-white",
} as const;

export const typographyClasses = {
  app: "font-['Nunito_Variable','Nunito',system-ui,sans-serif]",
  hero: "font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]",
  logo: "font-['Ubuntu',sans-serif] text-[46px] font-bold leading-none max-sm:text-[34px]",
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
  portablePagePadding: "max-[1100px]:py-8 max-sm:py-6",
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
  portableFixedHeaderOffset: "max-[1100px]:pt-16",
  portableBottomNavOffset: "max-[1100px]:pb-24",
  modalOuterMaxHeight: "max-h-[88vh]",
  modalFormBodyMaxHeight: "max-h-[56vh]",
  modalFormBodyMobileMaxHeight: "max-sm:max-h-[52vh]",
  plannerPickerBrowserHeight: "h-[44vh]",
  plannerPickerModalMaxHeight:
    "max-h-[calc(100vh_-_48px)] max-[1100px]:max-h-[calc(100vh_-_200px)] max-sm:max-h-[calc(100vh_-_96px)]",
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
  panel: "border-[#C8C0B5] bg-[#E5D5BC]/30 dark:border-white/[0.10] dark:bg-white/[0.035]",
  field: "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] focus-visible:outline-[#7A8864] dark:border-white/[0.10] dark:bg-neutral-900 dark:text-neutral-100 dark:focus-visible:outline-white",
  modal: "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] dark:border-white/[0.12] dark:bg-neutral-950 dark:text-neutral-100",
} as const;

export const modalLayoutClasses = {
  centeredBackdrop: `fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
} as const;

export const thumbnailStyles = {
  recipeShell:
    "relative aspect-square w-full overflow-hidden rounded-md bg-neutral-800 text-left",
  recipeShellInteractive:
    "cursor-pointer transition-transform hover:scale-[1.01]",
  recipeImage: "h-full w-full object-cover",
  recipeImageFallback: "h-full w-full bg-neutral-700",
  // The imageless tile scales its initials with its own width (container query units).
  recipeTile:
    "@container relative flex h-full w-full overflow-hidden select-none ring-1 ring-inset ring-black/10",
  recipeTileInitials:
    "m-auto text-[30cqw] font-black leading-none tracking-tight",
  recipeTileInitialsTop:
    "absolute left-[8%] top-[7%] text-[17cqw] opacity-90 font-black leading-none tracking-tight",
  recipeImageOverlay: "light:hidden dark:pointer-events-none dark:absolute dark:inset-0 dark:bg-black/20",
  recipeTitleBand: "bg-[#556145]/95 dark:bg-neutral-700/95",
  recipeTitleBandLayout:
    "absolute inset-x-0 bottom-0 flex min-h-[22%] flex-col justify-center px-3 py-2",
  recipeTitleBandLayoutExpanded:
    "absolute inset-x-0 bottom-0 flex min-h-[46%] flex-col justify-end px-3 py-2",
  recipeTitleBandLayoutMicro:
    "absolute inset-x-0 bottom-0 flex h-[38%] min-h-0 flex-col justify-center px-1.5",
  recipeTitleBandExtra:
    "absolute inset-x-3 top-2",
  // Names are at most 30 characters; two lines show them whole on a phone's two-column grid.
  recipeTitle: "line-clamp-2 break-words text-base font-bold leading-tight text-[#FAF7F2]",
  recipeTitleCompact: "line-clamp-2 break-words text-sm font-bold leading-tight text-[#FAF7F2]",
  recipeTitleMicro:
    "truncate text-[10px] font-bold leading-tight text-[#FAF7F2]",
  recipeSubtitle: "text-[#FAF7F2] dark:text-neutral-300",
  recipeSubtitleLayout: "mt-0.5 truncate text-xs font-semibold leading-tight",
  recipeSubtitleLayoutCompact:
    "mt-0.5 truncate text-[10px] font-semibold leading-tight",
  recipeSubtitleLayoutMicro:
    "mt-0 truncate text-[8px] font-semibold leading-tight",
  ingredientShell: `grid min-h-12 w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 rounded-md p-1.5 text-left ${shadowClasses.subtle} transition bg-[#E5D5BC]/45 dark:bg-white/[0.08]`,
  // The name and initials on an ingredient or recipe line thumbnail.
  ingredientShellText: "text-[#333929] dark:text-[#FAF7F2]",
  ingredientShellCompact: "min-h-10 grid-cols-[1.75rem_minmax(0,1fr)] p-1",
  ingredientSelectedOutline: "outline outline-2 outline-current",
  ingredientSelectedColorBorder: `border-2 ${siteColorClasses.selectedThumbnailBorder}`,
  ingredientSelectedMuted: "opacity-45",
  ingredientImageFrame:
    "flex h-9 w-9 items-center justify-center overflow-hidden rounded-md",
  ingredientImageFrameCompact: "h-7 w-7",
  ingredientImage: "h-full w-full object-cover",
  ingredientImageFallback:
    "flex h-full w-full items-center justify-center text-xs font-black leading-none",
  ingredientDot: "h-3 w-3 rounded-md",
  ingredientContent: "grid min-w-0 content-center gap-0.5",
  ingredientFooter: "col-span-full min-w-0",
  ingredientName: "min-w-0 truncate text-sm font-bold leading-tight",
  ingredientNameCompact: "text-xs",
  ingredientBrand:
    "min-w-0 truncate text-[11px] font-semibold leading-tight opacity-75",
  ingredientBrandCompact: "text-[10px]",
} as const;

export const focusBase =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export const toastStyles = {
  viewport:
    "pointer-events-none fixed left-1/2 top-20 isolate z-[90] w-[min(24rem,calc(100vw_-_2rem))] -translate-x-1/2 max-sm:top-16",
  success: `pointer-events-auto flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm font-bold opacity-100 backdrop-blur-none ${shadowClasses.overlay} border-[#7A8864] bg-[#DDECCF] text-[#3C4A2E] dark:border-emerald-300/35 dark:bg-emerald-950 dark:text-emerald-50`,
  closeButton: `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-extrabold transition-colors ${focusBase} ${siteColorClasses.focus} text-[#3C4A2E] hover:bg-[#7A8864]/15 dark:text-emerald-50 dark:hover:bg-white/[0.10]`,
} as const;

export const loadErrorStyles = {
  panel: `mb-4 flex items-center justify-between gap-4 ${radiusClasses.figma6} border px-4 py-3 max-sm:flex-col max-sm:items-stretch border-red-700/30 bg-red-50 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100`,
  text: "grid min-w-0 gap-1",
  title: "text-sm font-extrabold leading-tight",
  body: "text-sm font-semibold leading-snug opacity-90",
  retryButton: `inline-flex h-10 shrink-0 items-center justify-center ${radiusClasses.figma6} border px-4 text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${focusBase} ${siteColorClasses.focus} border-red-700/40 bg-white text-red-900 hover:bg-red-100 dark:border-red-300/40 dark:bg-red-950 dark:text-red-50 dark:hover:bg-red-900`,
} as const;

/** The page shown by the error boundary; it cannot rely on the theme, so it uses neutral colours. */
export const errorBoundaryStyles = {
  shell: "flex min-h-screen items-center justify-center bg-neutral-900 p-6 text-neutral-100",
  panel: "grid w-full max-w-md gap-4 rounded-md border border-white/[0.12] bg-neutral-950 p-6",
  title: "text-xl font-bold leading-tight",
  body: "text-sm font-semibold leading-[1.5] text-neutral-300",
  details: "max-h-32 overflow-auto rounded-md bg-black/40 p-3 text-xs text-neutral-400",
  button:
    "inline-flex h-10 items-center justify-center justify-self-start rounded-md border border-white/[0.16] bg-white/[0.08] px-4 text-sm font-bold text-neutral-100 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
} as const;

const autofillHintTextClasses = "text-[10px] font-extrabold uppercase leading-tight text-[#556145] dark:text-neutral-400";

export const controlStyles = {
  modalCloseButton: `inline-flex h-9 w-9 shrink-0 -translate-y-1 items-center justify-center ${radiusClasses.figma6} p-0 transition-colors max-sm:h-11 max-sm:w-11 max-sm:-translate-y-1.5 [&_svg]:h-3.5 [&_svg]:w-3.5 ${focusBase} ${siteColorClasses.focus} bg-[#E5D5BC] text-[#556145] hover:bg-[#C8C0B5] dark:bg-white/[0.08] dark:text-neutral-200 dark:hover:bg-white/[0.14]`,
  primaryButton: `inline-flex h-12 min-w-32 items-center justify-center ${radiusClasses.figma6} border px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses.focus} border-[#7A8864]/35 bg-[#64714F] text-[#FAF7F2] hover:bg-[#556145] dark:border-white/[0.12] dark:bg-white/[0.14] dark:text-white dark:hover:bg-white/[0.2]`,
  secondaryButton: `inline-flex h-12 min-w-28 items-center justify-center ${radiusClasses.figma6} border px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses.focus} border-[#C8C0B5] bg-transparent text-[#556145] hover:bg-[#E5D5BC]/55 dark:border-white/[0.10] dark:text-neutral-200 dark:hover:bg-white/[0.08]`,
  removeButton: `inline-flex h-12 min-w-32 items-center justify-center ${radiusClasses.figma6} border px-6 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses.focus} border-red-950 bg-red-950 text-[#FAF7F2] hover:bg-red-900 dark:text-white`,
  compactSearchInput: `h-9 w-full ${radiusClasses.figma6} border px-3 text-sm font-semibold ${shadowClasses.subtle} outline-none placeholder:text-neutral-500 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none ${focusBase} ${siteColorClasses.focus} border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] dark:border-white/[0.10] dark:bg-neutral-200 dark:text-neutral-900`,
  formField: `h-12 min-w-0 w-full rounded-md border px-4 text-base font-normal outline-none placeholder:text-neutral-500 ${focusBase} ${surfaceClasses.field}`,
  compactTextField: `h-8 min-w-0 rounded-md border px-2 text-xs font-semibold outline-none placeholder:text-neutral-500 disabled:opacity-45 ${focusBase} ${surfaceClasses.field}`,
  textArea: `min-h-32 min-w-0 w-full resize-y rounded-md border px-4 py-3 text-base font-normal leading-[1.5] outline-none placeholder:text-neutral-500 ${focusBase} ${surfaceClasses.field}`,
} as const;

export const segmentedToggleStyles = {
  shell: (widthClass = "w-full") =>
    `${sizeClasses.plannerControlHeight} ${widthClass} flex max-w-full items-stretch overflow-hidden ${radiusClasses.figma6} border p-1 ${shadowClasses.subtle} ${focusBase} ${siteColorClasses.focus} ${siteColorClasses.plannerToggle}`,
  option: (selected: boolean) =>
    `flex h-full min-h-0 min-w-0 flex-1 items-center justify-center ${radiusClasses.figma6} px-3 text-xs font-semibold leading-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${selected ? `${siteColorClasses.plannerToggleSelected}` : `${siteColorClasses.plannerToggleIdle}`}`,
} as const;

export const appStyles = {
  shell: `relative min-h-screen overflow-x-clip before:pointer-events-none before:absolute before:inset-0 before:content-[''] ${sizeClasses.portableFixedHeaderOffset} ${typographyClasses.app} ${siteColorClasses.page}`,
  overlay: "relative min-h-screen",
  contentBackground: "bg-transparent",
};

export const headerStyles = {
  shell: `relative z-10 border-b max-[1100px]:fixed max-[1100px]:inset-x-0 max-[1100px]:top-0 max-[1100px]:z-[60] ${shadowClasses.raised} ${siteColorClasses.header} ${siteColorClasses.fixedHeader}`,
  // 64 px high on narrow screens, matching the shell's top padding and the cookbook's docked search row.
  inner: `${layoutClasses.contentWidth} grid min-h-20 grid-cols-[1fr_auto_1fr] items-center gap-6 py-0 max-[1100px]:h-16 max-[1100px]:min-h-0 max-[1100px]:grid-cols-[1fr_auto] max-[1100px]:gap-x-4`,
  logo: `min-h-11 justify-self-start border-0 bg-transparent p-0 text-left no-underline ${typographyClasses.logo} ${siteColorClasses.headerForeground}`,
  actions: "flex items-center justify-end gap-2",
  nav: `flex items-center justify-center gap-2 max-[1100px]:fixed max-[1100px]:inset-x-0 max-[1100px]:bottom-0 max-[1100px]:z-50 max-[1100px]:border-t max-[1100px]:px-6 max-[1100px]:pt-2 max-[1100px]:[padding-bottom:calc(0.5rem+env(safe-area-inset-bottom))] max-sm:px-4 ${siteColorClasses.header} ${siteColorClasses.bottomNav}`,
  navButton: (selected: boolean) =>
    `inline-flex h-16 min-w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border px-3 transition-colors duration-150 max-[1100px]:h-14 max-[1100px]:min-w-0 max-[1100px]:flex-1 max-[1100px]:px-2 ${focusBase} ${siteColorClasses.focus} ${selected ? `${siteColorClasses.controlSelected}` : `${siteColorClasses.control}`}`,
  icon: "h-8 w-8 fill-current max-[1100px]:h-5 max-[1100px]:w-5",
  navLabel: "text-xs font-semibold leading-none max-sm:text-[11px]",
  settingsButton: (selected: boolean) =>
    `inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-0 transition-colors duration-150 max-[1100px]:h-11 max-[1100px]:w-11 ${focusBase} ${siteColorClasses.focus} ${selected ? `${siteColorClasses.controlSelected}` : `${siteColorClasses.control}`}`,
  themeButton: `inline-flex h-8 w-14 cursor-pointer items-center justify-center justify-self-end rounded-md border border-transparent bg-transparent p-0 max-[1100px]:h-11 ${focusBase} ${siteColorClasses.focus}`,
  // Exception to the rectangular control rule: the theme switch keeps the familiar rounded toggle shape.
  themeTrack: `relative h-8 w-14 rounded-full border ${siteColorClasses.switchTrack}`,
  themeThumb: `absolute left-[3px] top-[3px] inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 light:translate-x-6 ${siteColorClasses.switchThumb}`,
  themeIcon: "h-4 w-4 fill-current",
};

export const pageStyles = {
  shell: `${layoutClasses.contentWidth} ${responsiveClasses.portablePagePadding} ${sizeClasses.portableBottomNavOffset} relative py-12`,
  contentShell: "grid w-full gap-6 max-[1100px]:pb-20",
  plannerShell: `${layoutClasses.contentWidth} ${responsiveClasses.portablePagePadding} ${sizeClasses.portableBottomNavOffset} relative pb-12 pt-6`,
  showColumnDebugOverlay: false,
  columnDebugOverlay:
    "pointer-events-none absolute inset-y-0 left-0 right-0 grid grid-cols-12 gap-6 opacity-100",
  columnDebugCell: "bg-red-500/10 outline outline-1 outline-red-500/30",
};

export const settingsStyles = {
  shell: pageStyles.contentShell,
  quickSettingsRow:
    "flex flex-wrap items-start justify-between gap-4 max-sm:grid max-sm:w-full max-sm:grid-cols-1",
  title: "text-3xl font-bold leading-tight text-[#556145] dark:text-neutral-50",
  panel: `grid gap-4 rounded-md border p-6 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  panelTitle: "text-xl font-bold leading-tight",
  panelBody: "text-sm font-semibold leading-[1.5] text-[#556145] dark:text-neutral-300",
  languagePanel: `flex w-fit flex-wrap items-center gap-4 rounded-md border p-2 max-sm:w-full max-sm:justify-between ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  languagePanelTitle: "pl-2 text-sm font-bold leading-tight",
  languageOptions: "flex items-center gap-2",
  languageButton: (selected: boolean) =>
    `inline-flex h-10 min-w-20 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition-colors max-sm:h-11 ${focusBase} ${siteColorClasses.focus} ${selected ? "border-[#7A8864]/45 bg-[#FAF7F2] text-[#556145] dark:border-white/[0.18] dark:bg-white/[0.12] dark:text-white" : "border-[#C8C0B5] bg-[#E5D5BC]/35 text-[#556145] hover:bg-[#E5D5BC]/55 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/[0.08]"}`,
  languageFlag: "text-base leading-none",
  languageCode: "text-xs font-extrabold uppercase leading-none",
  form: "grid gap-4",
  formGrid: "grid grid-cols-2 gap-4 max-sm:grid-cols-1",
  integrationBlock: "grid gap-4 border-b pb-4 last:border-b-0 last:pb-0",
  subsectionTitle: "text-base font-bold leading-tight",
  fieldGroup: "grid gap-2",
  label: "text-sm font-bold leading-tight",
  buttonGroup: "flex flex-wrap items-center gap-2",
  inlineActionRow: "flex flex-wrap items-center justify-start gap-3 max-sm:justify-center",
  textInput: controlStyles.formField,
  selectInput: controlStyles.formField,
  helpText: "text-xs font-semibold leading-[1.45] text-[#556145] dark:text-neutral-400",
  statusRow:
    "flex flex-wrap items-center justify-between gap-4 max-sm:grid max-sm:grid-cols-1 max-sm:justify-items-center max-sm:gap-2",
  statusText: (tone: "error" | "success") =>
    `text-sm font-bold ${tone === "error" ? "text-red-700 dark:text-red-200" : "text-[#556145] dark:text-emerald-200"}`,
  saveButton: `${controlStyles.primaryButton} max-sm:w-full max-sm:max-w-xs`,
  secondaryButton: `${controlStyles.secondaryButton} max-sm:w-full max-sm:max-w-xs`,
  currentProviderCard: `flex w-fit flex-wrap items-center gap-4 rounded-md border p-2 max-sm:w-full max-sm:justify-between ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  currentProviderTitle: "text-sm font-bold leading-tight",
  currentProviderDetails: "flex flex-wrap items-center gap-2",
  currentProviderItem: "min-w-0 rounded-md border px-3 py-1.5 border-[#C8C0B5] bg-[#FAF7F2]/55 dark:border-white/[0.08] dark:bg-white/[0.04]",
  currentProviderLabel:
    "text-[10px] font-extrabold uppercase leading-tight",
  currentProviderValue:
    "mt-0.5 min-w-0 truncate text-sm font-bold leading-tight",
  systemGrid: "grid gap-4",
  systemRow: `grid grid-cols-[10rem_minmax(0,1fr)] gap-4 rounded-md border px-4 py-2 text-sm max-sm:grid-cols-1 ${surfaceClasses.field}`,
  systemLabel: "font-bold",
  systemValue: "min-w-0 break-words font-semibold",
} as const;

export const scannerStyles = {
  shell: pageStyles.contentShell,
  header: "grid gap-2",
  title: "text-3xl font-bold leading-tight text-[#556145] dark:text-neutral-50",
  intro: "max-w-2xl text-sm font-semibold leading-[1.5] text-[#556145] dark:text-neutral-300",
  introLink: "font-extrabold underline underline-offset-2 text-[#556145] dark:text-neutral-50",
  panel: `grid gap-4 rounded-md border p-4 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  desktopScannerHint: `hidden rounded-md border px-4 py-3 text-sm font-semibold leading-[1.45] min-[1101px]:block ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  scannerSurface: "grid gap-4",
  lookupForm: (isOpenOnMobile: boolean) =>
    `grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-sm:grid-cols-1 ${
      isOpenOnMobile ? "" : "max-[1100px]:hidden"
    }`,
  field: "grid gap-2",
  label: "text-sm font-bold leading-tight",
  labelRow: "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1",
  sectionTitleRow: "flex flex-wrap items-center justify-between gap-2",
  autofillHint: autofillHintTextClasses,
  autofillReservedHint: `min-h-3 ${autofillHintTextClasses}`,
  nutritionSourceText: "grid gap-1 text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  nutritionSourceRow: "grid gap-1",
  nutritionSourceLine: "flex flex-wrap items-center gap-x-1.5 gap-y-1",
  nutritionSourcePrimaryLine: "flex flex-wrap items-center justify-between gap-x-3 gap-y-1",
  nutritionSourceSupplementLine: "flex flex-wrap items-center justify-between gap-x-3 gap-y-1",
  nutritionSourceActions: "inline-flex items-center gap-3",
  nutritionSourceLink: "text-xs font-bold leading-tight underline underline-offset-2 text-[#556145] hover:text-[#3C4A2E] dark:text-neutral-200 dark:hover:text-white",
  sourceActionButton: `h-auto rounded-none border-0 bg-transparent p-0 text-xs font-extrabold underline underline-offset-2 transition-colors ${focusBase} ${siteColorClasses.focus} text-[#556145] hover:text-[#3C4A2E] dark:text-neutral-200 dark:hover:text-white`,
  nutritionSupplementWarning: "rounded-md border px-3 py-2 text-xs font-bold border-[#9B7A3D]/30 bg-[#E5D5BC]/65 text-[#5F4A24] dark:border-amber-300/25 dark:bg-amber-200/10 dark:text-amber-100",
  nutritionSupplementWarningRow: "flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs font-bold border-[#9B7A3D]/30 bg-[#E5D5BC]/65 text-[#5F4A24] dark:border-amber-300/25 dark:bg-amber-200/10 dark:text-amber-100",
  input: controlStyles.formField,
  submitButton: controlStyles.primaryButton,
  scannerActions: "grid gap-3 min-[1101px]:hidden",
  cameraButton: `${controlStyles.primaryButton} h-14 w-full text-base`,
  manualEntryButton: `${controlStyles.secondaryButton} h-9 w-fit justify-self-center px-3 text-xs`,
  cameraFrame: `relative aspect-video w-full overflow-hidden rounded-md border ${shadowClasses.subtle} border-[#C8C0B5] bg-[#FAF7F2] dark:border-white/[0.12] dark:bg-neutral-950`,
  cameraVideo: "h-full w-full object-cover",
  cameraGuide:
    "pointer-events-none absolute inset-[18%] rounded-md border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]",
  cameraStatus: "text-sm font-semibold leading-[1.45] text-[#556145] dark:text-neutral-300",
  statusError: `${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold border-red-700/25 bg-red-700/10 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200`,
  emptyState: `rounded-md border p-6 text-center text-sm font-bold ${surfaceClasses.panel}`,
  resultList: "grid gap-3",
  productCard: `grid grid-cols-[6rem_minmax(0,1fr)_auto] gap-4 rounded-md border p-3 max-sm:grid-cols-[5rem_minmax(0,1fr)] ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  productImageFrame: "aspect-square overflow-hidden rounded-md border border-[#C8C0B5] bg-[#FAF7F2] dark:border-white/[0.10] dark:bg-neutral-900",
  productImage: "h-full w-full object-cover",
  productImageFallback: "flex h-full w-full items-center justify-center px-2 text-center text-xs font-bold text-[#556145] dark:text-neutral-400",
  productMain: "grid min-w-0 content-start gap-2",
  productTitle: "min-w-0 text-lg font-bold leading-tight",
  productMeta: "text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  chipRow: "flex flex-wrap gap-2",
  chip: "rounded-md px-2 py-1 text-xs font-bold bg-[#E5D5BC] text-[#556145] dark:bg-white/[0.10] dark:text-neutral-100",
  nutritionGrid: "grid grid-cols-4 gap-2 max-md:grid-cols-2 max-sm:grid-cols-1",
  nutritionItem: `rounded-md border px-2 py-1 text-xs font-semibold ${surfaceClasses.panel}`,
  candidateSection: "grid gap-3",
  candidateHeader: "flex flex-wrap items-baseline gap-3",
  candidateTitle: "text-lg font-bold leading-tight",
  candidateSubtitle: "text-sm font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  candidateList: "grid gap-2",
  candidateButton: (selected: boolean) =>
    `grid w-full grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 rounded-md border p-3 text-left transition-colors max-[380px]:grid-cols-[3.25rem_minmax(0,1fr)] ${shadowClasses.subtle} ${focusBase} ${siteColorClasses.focus} ${selected ? "border-[#7A8864]/50 bg-[#E5D5BC]/55 dark:border-white/[0.28] dark:bg-white/[0.14]" : `${surfaceClasses.panel}`}`,
  candidateImageFrame: "flex aspect-square w-16 overflow-hidden rounded-md border max-[380px]:w-14 border-[#C8C0B5] bg-[#FAF7F2] dark:border-white/[0.10] dark:bg-neutral-900",
  candidateTextStack: "grid min-w-0 gap-1",
  candidateName: "min-w-0 text-base font-bold leading-tight",
  candidateMeta: "min-w-0 text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  ingredientEditor: `grid gap-3 rounded-md border p-3 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  editorImageRow: "grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3",
  editorImageLabel: "col-span-2 text-sm font-bold leading-tight",
  editorImageFrame: `aspect-square w-[4.5rem] overflow-hidden rounded-md border ${shadowClasses.subtle} border-[#C8C0B5] bg-[#FAF7F2] dark:border-white/[0.10] dark:bg-neutral-900`,
  editorImageButton: `${controlStyles.secondaryButton} h-12 min-w-0 cursor-pointer px-4 text-sm`,
  hiddenFileInput: "sr-only",
  compactFormGrid:
    "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3 max-sm:grid-cols-1",
  groupedTagPanel: "grid gap-3",
  groupedTagSection: "grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 border-[#7A8864]/25 dark:border-white/[0.10]",
  groupedTagTitle: "text-[11px] font-extrabold uppercase tracking-wide text-[#556145] dark:text-neutral-400",
  tagGrid: "grid grid-cols-2 gap-2",
  tagOption: `flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${surfaceClasses.field}`,
  colorRow: "grid grid-cols-[minmax(0,1fr)_3rem] items-end gap-3",
  colorInput:
    "h-12 w-full cursor-pointer rounded-md border border-transparent bg-transparent p-0",
  saveButton: controlStyles.primaryButton,
  editorModalBackdrop: modalLayoutClasses.centeredBackdrop,
  editorModalPanel: `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-6 max-sm:max-h-[calc(100vh_-_212px)] max-sm:p-4 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  editorModalHeader: "flex items-start justify-between gap-4",
  editorModalTitle: "text-2xl font-bold leading-tight max-sm:text-xl",
  editorModalCloseButton: controlStyles.modalCloseButton,
  editorModalBody: "grid min-h-0 gap-3 overflow-y-auto pr-1",
  editorModalFooter: "flex flex-wrap items-center justify-end gap-3 border-t pt-3 max-sm:flex-nowrap max-sm:[padding-bottom:env(safe-area-inset-bottom)] border-[#C8C0B5] dark:border-white/[0.10]",
  editorModalActionButton:
    "max-sm:h-10 max-sm:min-w-0 max-sm:flex-1 max-sm:px-3 max-sm:text-sm",
  editorModalError: "basis-full rounded-md px-3 py-2 text-sm font-bold max-sm:text-xs bg-[#B44E3A]/10 text-[#8E321F] dark:bg-red-500/15 dark:text-red-100",
  matvareCandidateModalPanel: `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-5 max-sm:max-h-[calc(100vh_-_212px)] max-sm:p-4 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  matvareCandidateModalBody: "grid min-h-0 gap-2 overflow-y-auto pr-1",
  infoModalPanel: `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-5 max-sm:max-h-[calc(100vh_-_212px)] max-sm:p-4 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  infoModalBody: "grid min-h-0 gap-3 overflow-y-auto pr-1",
  infoText: "text-sm font-semibold leading-[1.5] text-[#556145] dark:text-neutral-300",
  infoList: "grid list-disc gap-2 pl-5 text-sm font-semibold leading-[1.45] text-[#556145] dark:text-neutral-300",
  matvareSearchForm: "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]",
  matvareCandidateButton: `grid gap-1 rounded-md border p-3 text-left transition-colors ${focusBase} ${siteColorClasses.focus} border-[#C8C0B5] bg-[#FAF7F2]/70 text-[#556145] hover:bg-[#E5D5BC]/55 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-neutral-100 dark:hover:bg-white/[0.10]`,
  matvareCandidateName: "text-sm font-extrabold leading-tight",
  matvareCandidateMeta: "text-xs font-bold text-[#556145] dark:text-neutral-300",
  matvareCandidateMacros: "text-xs font-semibold leading-[1.4] text-[#556145] dark:text-neutral-400",
} as const;

export const nutritionStyles = {
  shell: pageStyles.contentShell,
  header: "grid gap-2",
  title: "text-3xl font-bold leading-tight text-[#556145] dark:text-neutral-50",
  intro: "max-w-2xl text-sm font-semibold leading-[1.5] text-[#556145] dark:text-neutral-300",
  panel: `grid grid-cols-3 items-end gap-3 rounded-md border p-4 max-md:grid-cols-2 max-sm:grid-cols-1 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  field: "grid gap-2",
  label: "text-sm font-bold leading-tight",
  input: controlStyles.formField,
  statusError: `${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold border-red-700/25 bg-red-700/10 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200`,
  warningPanel: `${radiusClasses.figma6} border p-4 ${shadowClasses.subtle} border-[#9B7A3D]/30 bg-[#E5D5BC]/65 text-[#5F4A24] dark:border-amber-300/25 dark:bg-amber-200/10 dark:text-amber-100`,
  warningTitle: "text-sm font-extrabold leading-tight",
  warningText: "mt-1 text-sm font-semibold leading-[1.45]",
  warningList: "mt-3 flex flex-wrap gap-2",
  warningChip: `${radiusClasses.figma6} border px-2 py-1 text-xs font-bold border-[#9B7A3D]/25 bg-[#FAF7F2] text-[#5F4A24] dark:border-amber-200/20 dark:bg-black/20 dark:text-amber-50`,
  emptyState: `rounded-md border p-6 text-center text-sm font-bold ${surfaceClasses.panel}`,
  grid: "grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2 max-sm:grid-cols-1",
  dailyPanel: `grid gap-3 rounded-md border p-4 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  dailyHeader: "flex flex-wrap items-baseline justify-between gap-2",
  dailyHeaderMeta: "flex flex-wrap items-baseline justify-end gap-3",
  dailyTitle: "text-base font-bold leading-tight",
  dailySubtitle: "text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  dailyGrid: "grid grid-cols-7 gap-2 max-[1100px]:grid-cols-4 max-sm:grid-cols-2",
  dailyItem: "grid gap-1 rounded-md border px-3 py-2 text-sm font-semibold border-[#C8C0B5] bg-[#E5D5BC]/45 text-[#556145] dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-neutral-200",
  dailyDay: "text-xs font-bold uppercase",
  dailyCalories: "text-base font-extrabold leading-tight text-[#556145] dark:text-neutral-50",
  dailyAverage: "text-sm font-extrabold leading-tight text-[#556145] dark:text-neutral-50",
  item: `grid gap-3 rounded-md border p-4 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  itemHeader: "flex items-start justify-between gap-3",
  itemTitle: "text-base font-bold leading-tight",
  itemTotal: "text-sm font-extrabold leading-tight text-[#556145] dark:text-neutral-50",
  progressTrack: "h-2 overflow-hidden rounded-full bg-[#D7CCBB] dark:bg-white/[0.10]",
  progressFill: "block h-full rounded-full bg-[#556145] dark:bg-emerald-300",
  itemMeta: "text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  sourceText: "text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  sourceLink: `font-extrabold underline-offset-2 hover:underline ${siteColorClasses.plannerCounterAccent}`,
} as const;

export const plannerControlsStyles = {
  viewport: "mx-auto w-full max-[1100px]:w-[min(100%,36rem)] max-sm:w-full",
  /* Keep the planner content aligned with the cookbook grid using the shared spacing scale. */
  // One row on wide screens (actions, week, view switch) so the whole week fits under it on a 900 px screen.
  shell: `mb-5 grid w-full grid-cols-12 items-center ${layoutClasses.gridGap} max-[1100px]:mb-6 max-[1100px]:grid-cols-1 max-[1100px]:gap-3`,
  datePrimaryRow: `flex w-full items-center justify-center ${layoutClasses.controlGap} min-[1101px]:gap-2 max-[1100px]:justify-between max-[1100px]:gap-2`,
  // The year floats above the range label without increasing the top-control row height.
  dateYearRow: "pointer-events-none absolute inset-x-0 -top-4 z-0 flex h-0 justify-center overflow-visible text-sm font-bold leading-none text-[#556145] dark:text-neutral-400",
  datePrimary: `min-w-36 whitespace-nowrap text-center text-3xl font-bold leading-tight max-[1100px]:min-w-0 max-[1100px]:flex-1 max-[1100px]:truncate max-sm:text-2xl ${siteColorClasses.plannerCounterAccent}`,
  leftCell:
    "order-1 col-span-5 flex items-center justify-start max-[1100px]:hidden",
  centerCell:
    "relative order-2 col-span-4 flex items-center justify-center pt-3 max-[1100px]:order-1 max-[1100px]:col-span-1 max-[1100px]:min-w-0 max-[1100px]:pt-4",
  rightCell:
    "order-3 col-span-3 flex items-center justify-end max-[1100px]:hidden",
  counterActions: `grid w-full grid-cols-4 ${layoutClasses.calendarGap}`,
  actionSlotLeft: "min-w-0",
  actionSlotCenter: "min-w-0",
  actionSlotRight: "min-w-0",
  iconOnlyButton: `${sizeClasses.plannerControlHeight} max-[1100px]:h-11 group relative z-0 inline-flex w-full min-w-0 items-center justify-center gap-1.5 ${radiusClasses.figma6} border px-2 text-sm font-bold transition-colors duration-150 hover:z-30 focus-visible:z-30 disabled:cursor-not-allowed disabled:border-dashed max-sm:gap-1 max-sm:px-1.5 max-sm:text-xs ${focusBase} ${siteColorClasses.focus} ${siteColorClasses.plannerControl}`,
  iconButton: `${sizeClasses.plannerControlHeight} inline-flex aspect-square shrink-0 items-center justify-center ${radiusClasses.figma6} border max-[1100px]:h-11 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses.focus} ${siteColorClasses.plannerControl}`,
  nextAndTodayGroup: "relative inline-flex gap-2",
  todayButton: `${sizeClasses.plannerControlHeight} max-[1100px]:h-11 inline-flex shrink-0 whitespace-nowrap items-center justify-center ${radiusClasses.figma6} border px-3 text-sm font-bold transition-colors duration-150 disabled:cursor-default disabled:opacity-55 max-sm:px-2.5 max-sm:text-xs ${focusBase} ${siteColorClasses.focus} ${siteColorClasses.plannerControl}`,
  buttonIcon: "h-4 w-4 shrink-0 fill-current",
  // Below 1440 px the four actions are icons with tooltips, so no label is cut off.
  actionButtonLabel: "min-w-0 truncate leading-none max-[1439px]:sr-only",
  mobileActionButtonLabel: "min-w-0 truncate leading-none",
  tooltip: `pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap ${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold opacity-0 ${shadowClasses.subtle} transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${siteColorClasses.plannerTooltip}`,
  viewToggle: `${segmentedToggleStyles.shell("w-full max-w-64")}`,
  viewToggleOption: (selected: boolean) =>
    `${segmentedToggleStyles.option(selected)}`,
  mobileControlButton: (selected = false) =>
    `hidden h-11 w-11 shrink-0 items-center justify-center ${radiusClasses.figma6} border p-0 max-[1100px]:inline-flex [&_svg]:h-5 [&_svg]:w-5 ${shadowClasses.subtle} transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses.focus} ${selected ? `${siteColorClasses.plannerToggleSelected}` : "border-[#7A8864] bg-[#FAF7F2] text-[#556145] hover:bg-[#E5D5BC] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-900"}`,
  mobileActionsBackdrop:
    "fixed inset-0 z-[100] hidden items-center justify-center bg-black/35 p-4 max-[1100px]:flex",
  mobileActionsPanel: `grid w-full max-w-xs grid-rows-[auto_minmax(0,1fr)] gap-3 ${radiusClasses.figma6} border p-4 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  mobileActionsHeader: "flex items-center justify-between gap-3",
  mobileActionsTitle: "text-lg font-bold leading-tight",
  mobileActionsCloseButton: controlStyles.modalCloseButton,
  mobileActionsBody: "grid min-h-0 gap-2",
  statusError: `mb-4 ${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold border-red-700/25 bg-red-700/10 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200`,
};

export const prepHelperStyles = {
  modalBackdrop: modalLayoutClasses.centeredBackdrop,
  modalPanel: `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-6 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  header: "flex items-start justify-between gap-4",
  title: "text-2xl font-bold leading-tight",
  subtitle: "mt-1 text-sm font-semibold leading-[1.45] text-[#556145] dark:text-neutral-400",
  closeButton: `${controlStyles.modalCloseButton} max-sm:hidden`,
  bodyFrame: "grid min-h-0 gap-3",
  list: "grid max-h-[48vh] gap-3 overflow-y-auto pr-1",
  item: `grid gap-2 rounded-md border p-3 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  itemHeader: "flex flex-wrap items-start justify-between gap-3",
  itemName: "text-base font-bold leading-tight",
  itemAmount: "whitespace-nowrap text-sm font-extrabold",
  actionList: "flex flex-wrap gap-2",
  actionChip: "rounded-md border px-2 py-1 text-xs font-bold border-[#7A8864]/25 bg-[#E5D5BC]/55 text-[#556145] dark:border-white/[0.10] dark:bg-white/[0.08] dark:text-neutral-100",
  sourceText: "text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  emptyState: `rounded-md border p-6 text-center text-sm font-bold ${surfaceClasses.panel}`,
  footer: "flex items-center justify-end border-t pt-4",
  secondaryButton: controlStyles.secondaryButton,
} as const;

const plannerMutedText = "text-[#556145] dark:text-neutral-300";

export const mealCalendarStyles = {
  shell: "flex w-full flex-col max-[1100px]:pb-8",
  // Breakfast, lunch and dinner above the three columns; on narrow screens each card names its meal instead.
  headerRow: `mb-2 grid grid-cols-3 ${layoutClasses.calendarGap} max-[1100px]:hidden`,
  headerLabel: `px-1 text-xs font-extrabold uppercase tracking-wider ${plannerMutedText}`,
  rows: "flex flex-col gap-2 max-[1100px]:gap-4",
  row: "relative max-[1100px]:grid max-[1100px]:gap-2",
  dayCell: (isToday = false) =>
    `absolute inset-y-0 right-full mr-2 flex w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-md border-0 p-0 max-[1100px]:static max-[1100px]:mr-0 max-[1100px]:min-h-11 max-[1100px]:w-full max-[1100px]:flex-row max-[1100px]:justify-between max-[1100px]:gap-2 max-[1100px]:px-2 max-[1100px]:py-1 ${isToday ? "bg-[#556145] text-[#FAF7F2] dark:bg-white/[0.12] dark:text-white" : `${siteColorClasses.plannerCounterAccent}`}`,
  dayCellButton: (isToday = false) =>
    `${mealCalendarStyles.dayCell(isToday)} cursor-pointer transition-opacity hover:opacity-80 ${focusBase} ${siteColorClasses.focus}`,
  dayTitleGroup: "flex items-center justify-center gap-1",
  dayHeaderTextGroup:
    "flex flex-col items-center max-[1100px]:min-w-0 max-[1100px]:flex-row max-[1100px]:gap-1.5",
  dayToggleIcon: (collapsed: boolean) =>
    `flex h-5 w-5 items-center justify-center transition-transform ${
      collapsed ? "" : "rotate-90"
    }`,
  dayToggleSvg: "h-3.5 w-3.5 fill-current",
  dayLabel: (isToday: boolean) =>
    `text-xl leading-none tracking-normal ${isToday ? "font-extrabold" : "font-light"}`,
  dayDate: (isToday = false) =>
    `text-sm font-semibold leading-none ${isToday ? "" : `${plannerMutedText}`}`,
  todayBadge: "text-[10px] font-extrabold uppercase leading-none tracking-wider",
  // On phones a collapsed day shows small previews of its planned meals.
  dayPreviewStrip: "flex items-center -space-x-1.5",
  dayPreviewSummary: (isToday = false) =>
    `mr-1 text-xs font-bold ${isToday ? "" : `${plannerMutedText}`}`,
  dayPreviewFilled: "block h-8 w-8 overflow-hidden rounded-full border-2 border-[#FAF7F2] dark:border-neutral-900",
  dayPreviewImage: "h-full w-full object-cover",
  dayPreviewImageFallback: "block h-full w-full bg-[#C8C0B5] dark:bg-neutral-700",
  dayMealGrid: (collapsed: boolean) =>
    `grid grid-cols-3 ${layoutClasses.calendarGap} max-[1100px]:grid-cols-1 max-[1100px]:gap-2 ${collapsed ? "hidden" : ""}`,
  mealSlot: (isToday: boolean, roomForTouchActions: boolean) =>
    `group/meal-slot relative flex ${radiusClasses.figma6} border transition-colors duration-150 ${roomForTouchActions ? "min-h-24" : "h-[5.5rem] max-[1100px]:h-auto max-[1100px]:min-h-[5.5rem]"} ${isToday ? "border-[#556145] dark:border-white/[0.28]" : "border-[#C8C0B5] dark:border-white/[0.08]"} bg-[#FAF7F2]/70 hover:bg-[#E5D5BC]/45 dark:bg-white/[0.035] dark:hover:bg-white/[0.06]`,
  mealSlotDropTarget: "data-[drag-active=true]:border-[#7A8864] data-[drag-active=true]:border-2 dark:data-[drag-active=true]:border-emerald-300/70",
  mealSlotButton: `flex w-full min-w-0 cursor-pointer items-stretch rounded-md p-2 text-left disabled:cursor-not-allowed ${focusBase}`,
  // A slot whose plan could not be loaded: visibly not an empty, editable slot.
  mealSlotUnavailable: "opacity-45",
  mealSlotDraggableButton: "min-[1101px]:cursor-grab min-[1101px]:active:cursor-grabbing",
  // With a mouse the card's actions appear on hover or when the card has keyboard focus (F22); on
  // touch screens they are always shown, in their own column at the card's right edge.
  mealSlotActions: (revealOnHover: boolean) =>
    revealOnHover
      ? "pointer-events-none absolute right-1.5 top-1.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover/meal-slot:pointer-events-auto group-hover/meal-slot:opacity-100 group-focus-within/meal-slot:pointer-events-auto group-focus-within/meal-slot:opacity-100"
      : "flex shrink-0 flex-col justify-center p-1",
  // Mouse: small solid buttons over the card. Touch: 44 px ghost buttons in the card's own column.
  mealSlotActionButton: (compact: boolean) =>
    `inline-flex items-center justify-center rounded-md border ${focusBase} ${siteColorClasses.focus} ${compact ? "h-8 w-8 shadow-sm border-[#7A8864]/45 bg-[#FAF7F2] text-[#556145] hover:bg-[#EFE6D8] dark:border-white/[0.16] dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900" : "h-11 w-11 border-transparent bg-transparent text-[#556145] dark:text-neutral-200"}`,
  mealSlotDeleteButton: (compact: boolean) =>
    `inline-flex items-center justify-center rounded-md border ${focusBase} ${siteColorClasses.focus} ${compact ? "h-8 w-8 shadow-sm border-red-900/30 bg-red-900 text-[#FAF7F2] hover:bg-red-800 dark:border-red-400/35 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900" : "h-11 w-11 border-transparent bg-transparent text-red-800 dark:text-red-300"}`,
  mealSlotDeleteIcon: "h-4 w-4",
  mealSlotEmpty: "m-auto inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-sm font-bold border-[#7A8864]/45 text-[#556145] dark:border-white/[0.18] dark:text-neutral-300",
  mealSlotEmptyPlus: "text-base leading-none",
  mealSlotContent: (hasImage: boolean) =>
    `grid w-full min-w-0 gap-2.5 ${hasImage ? "grid-cols-[4.5rem_minmax(0,1fr)]" : "grid-cols-[0.375rem_minmax(0,1fr)] gap-2"}`,
  mealSlotColorBar: "block w-1.5 rounded-full",
  mealSlotImageFrame: "block h-[4.5rem] w-[4.5rem] self-center overflow-hidden rounded-md bg-[#E5D5BC]/45 dark:bg-neutral-800",
  mealSlotImage: "h-full w-full object-cover",
  mealSlotSkeletonImage: "block h-[4.5rem] w-[4.5rem] animate-pulse rounded-md bg-[#C8C0B5]/65 dark:bg-white/[0.08]",
  mealSlotSkeletonDetails: "grid min-w-0 content-start gap-2 pt-1",
  mealSlotSkeletonLine: (width: "short" | "title") =>
    `block h-3 animate-pulse rounded-full ${width === "title" ? "w-4/5" : "w-1/2"} bg-[#7A8864]/28 dark:bg-white/[0.10]`,
  mealSlotDetails: "flex min-w-0 flex-col justify-between gap-1",
  mealSlotEyebrow: `hidden text-[11px] font-extrabold uppercase leading-none tracking-wider max-[1100px]:block ${plannerMutedText}`,
  mealSlotTitle: "min-w-0 overflow-hidden break-words text-[15px] font-bold leading-tight [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] text-[#3C4A2E] dark:text-neutral-50",
  mealSlotMetaRow: "flex min-w-0 items-center gap-2",
  mealSlotSecondary: `min-w-0 flex-1 truncate text-xs font-semibold leading-snug ${plannerMutedText}`,
  mealSlotPortions: "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-extrabold leading-tight bg-[#E5D5BC] text-[#3C4A2E] dark:bg-white/[0.10] dark:text-neutral-50",
  // A month is a 7-column calendar on wide screens and a list of days on phones and tablets.
  monthHeaderGrid: `mb-2 grid grid-cols-7 ${layoutClasses.calendarGap} max-[1100px]:hidden`,
  monthGrid: `grid grid-cols-7 ${layoutClasses.calendarGap} max-[1100px]:grid-cols-1 max-[1100px]:gap-2`,
  monthHeaderCell: `px-2 text-xs font-extrabold uppercase tracking-wider ${plannerMutedText}`,
  monthDayCell: (muted: boolean, isToday: boolean) =>
    `group/day flex min-h-32 min-w-0 flex-col gap-1.5 ${radiusClasses.figma6} border p-1.5 transition-colors duration-150 max-[1100px]:min-h-0 max-[1100px]:flex-row max-[1100px]:items-start ${muted ? "border-dashed bg-transparent max-[1100px]:hidden" : ""} ${isToday ? "border-[#556145] dark:border-white/[0.32]" : "border-[#C8C0B5] dark:border-white/[0.08]"} ${muted ? "" : "bg-[#FAF7F2]/70 dark:bg-white/[0.035]"}`,
  monthDayNumberButton: (muted: boolean, isToday: boolean) =>
    `inline-flex h-7 min-w-7 items-center gap-1.5 self-start rounded-md px-1.5 text-sm font-extrabold leading-none disabled:cursor-default max-[1100px]:h-11 max-[1100px]:w-20 max-[1100px]:shrink-0 max-[1100px]:flex-col max-[1100px]:justify-center max-[1100px]:gap-0.5 ${focusBase} ${siteColorClasses.focus} ${isToday ? "bg-[#556145] text-[#FAF7F2] dark:bg-white dark:text-neutral-950" : `${muted ? `${plannerMutedText}` : `${siteColorClasses.plannerCounterAccent}`}`}`,
  monthDayName: "hidden text-[11px] font-extrabold uppercase tracking-wider max-[1100px]:block",
  monthDayNumber: (isToday: boolean) => (isToday ? "font-black" : ""),
  monthDayMeals: "grid min-w-0 flex-1 content-start gap-1",
  monthMealChip: `flex min-h-7 min-w-0 items-center gap-1.5 ${radiusClasses.figma6} px-1.5 py-1 text-left text-xs font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-45 max-[1100px]:min-h-11 max-[1100px]:text-sm ${focusBase} ${siteColorClasses.focus} bg-[#E5D5BC]/70 text-[#3C4A2E] hover:bg-[#E5D5BC] dark:bg-white/[0.10] dark:text-neutral-50 dark:hover:bg-white/[0.16]`,
  monthMealChipDot: "h-3 w-1.5 shrink-0 rounded-full ring-1 ring-black/10",
  monthMealChipText: "min-w-0 truncate",
  // Hidden until the day is hovered or has focus (mouse), or its date was tapped (touch).
  monthAddButton: (isRevealed: boolean) =>
    `flex min-h-7 min-w-0 items-center gap-1 ${radiusClasses.figma6} border border-dashed px-1.5 py-1 text-left text-xs font-bold leading-tight transition-opacity disabled:cursor-not-allowed max-[1100px]:min-h-11 max-[1100px]:text-sm ${focusBase} ${siteColorClasses.focus} ${isRevealed ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover/day:opacity-100 group-focus-within/day:opacity-100 [@media(hover:none)]:hidden"} border-[#7A8864]/55 text-[#556145] hover:bg-[#E5D5BC]/55 dark:border-white/[0.20] dark:text-neutral-200 dark:hover:bg-white/[0.08]`,
};

export const plannerPickerStyles = {
  modalBackdrop: modalLayoutClasses.centeredBackdrop,
  modalPanel: `grid ${sizeClasses.plannerPickerModalMaxHeight} w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-6 max-sm:gap-3 max-sm:p-4 ${shadowClasses.overlay} border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] dark:border-white/[0.12] dark:bg-neutral-950 dark:text-neutral-100`,
  header: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 max-sm:block",
  title: "text-2xl font-bold leading-tight max-sm:sr-only",
  subtitle: "mt-1 text-sm font-semibold leading-[1.45] max-sm:hidden text-[#556145] dark:text-neutral-400",
  closeButton: `${controlStyles.modalCloseButton} max-sm:hidden`,
  bodyFrame: "grid min-h-0 gap-4 max-sm:gap-2",
  bodyScrollFrame: "grid min-h-0 overflow-y-auto pr-1",
  controls:
    "mt-2 grid grid-cols-[13rem_auto_auto_minmax(0,1fr)_14rem] items-start gap-3 max-md:grid-cols-[13rem_auto_auto_minmax(0,1fr)_14rem] max-sm:mt-0 max-sm:grid-cols-[minmax(0,1fr)_auto_auto] max-sm:gap-2",
  searchInput: controlStyles.compactSearchInput,
  categoryButton: `inline-flex h-9 w-auto items-center justify-center rounded-md border px-3 text-xs font-extrabold max-[1100px]:w-9 max-[1100px]:px-0 ${shadowClasses.subtle} transition-colors ${siteColorClasses.cookbookFilterButton}`,
  filterButton: `inline-flex h-9 w-9 items-center justify-center rounded-md border p-0 text-xs font-extrabold ${shadowClasses.subtle} transition-colors ${siteColorClasses.cookbookFilterButton}`,
  browserModeSwitch: `${segmentedToggleStyles.shell()} col-start-5 h-9 w-full justify-self-end max-sm:order-first max-sm:col-span-3 max-sm:col-start-auto`,
  browserModeOption: (selected: boolean) =>
    `${segmentedToggleStyles.option(selected)}`,
  categoryButtonLabel: "max-[1100px]:sr-only",
  ingredientFilterChips:
    "col-span-full flex flex-wrap items-start gap-2 max-sm:col-span-3",
  quickFilterRow:
    "col-span-full flex flex-wrap items-center gap-2 max-sm:col-span-3",
  quickFilterChip: (selected: boolean) =>
    `inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-extrabold transition-colors ${focusBase} ${siteColorClasses.focus} ${selected ? "border-[#556145] bg-[#556145] text-[#FAF7F2] dark:border-emerald-300/70 dark:bg-emerald-300 dark:text-neutral-950" : "border-[#7A8864]/30 bg-[#FAF7F2] text-[#556145] hover:bg-[#EFE6D8] dark:border-white/[0.14] dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"}`,
  selectedSummary: "flex min-h-9 min-w-0 items-center rounded-md px-3 py-2 text-sm font-bold leading-tight bg-[#E5D5BC]/45 text-[#556145] dark:bg-white/[0.06] dark:text-neutral-200",
  selectedThumbnailList:
    "flex min-h-10 min-w-0 flex-1 flex-wrap items-center gap-2",
  selectedThumbnailButton: `inline-flex h-12 shrink-0 items-center gap-2 rounded-md border px-1.5 pr-2 ${shadowClasses.subtle} transition-colors ${focusBase} ${siteColorClasses.focus} border-[#7A8864]/25 bg-[#E5D5BC]/55 hover:bg-[#E5D5BC]/75 dark:border-white/[0.10] dark:bg-white/[0.06] dark:hover:bg-white/[0.10]`,
  selectedThumbnailFrame: "block h-9 w-9 shrink-0 overflow-hidden rounded-md bg-[#E5D5BC]/45 dark:bg-neutral-800",
  selectedThumbnailImage: "h-full w-full object-cover",
  selectedThumbnailFallback: "block h-full w-full bg-[#E5D5BC]/45 dark:bg-neutral-800",
  selectedThumbnailAmount: "whitespace-nowrap text-sm font-black leading-none text-[#556145] dark:text-neutral-100",
  bodyGrid: `mt-4 grid ${sizeClasses.plannerPickerBrowserHeight} overflow-y-auto pr-1 max-sm:mt-2`,
  filterRail: `max-h-[52vh] overflow-y-auto rounded-md p-3 max-sm:max-h-[44vh] ${shadowClasses.subtle} bg-[#E5D5BC]/45 dark:bg-white/[0.04]`,
  recipeGrid: "grid grid-cols-4 gap-3 max-sm:grid-cols-2",
  ingredientGrid: "grid auto-rows-max grid-cols-2 content-start items-start gap-2 max-sm:grid-cols-1",
  pickerCardShell: "relative h-fit min-w-0",
  pickerFloatingControls: "absolute inset-x-3 top-3 z-20",
  pickerIngredientCard: (selected: boolean) =>
    `relative grid min-w-0 rounded-md ${selected ? `after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-md after:ring-2 after:ring-inset after:content-[''] ${siteColorClasses.selectedThumbnailRing}` : ""}`,
  pickerIngredientThumbnail: "shadow-none",
  pickerIngredientControls: "px-2 pb-2 pt-2",
  recipeCard: (selected: boolean) =>
    `${shadowClasses.subtle} ${selected ? `after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-md after:ring-2 after:ring-inset after:content-[''] ${siteColorClasses.selectedThumbnailRing}` : "ring-1 ring-[#7A8864]/20 dark:ring-white/[0.08]"}`,
  pickerInlineControls: "flex min-w-0 items-center gap-1.5",
  pickerInlineLabel: "min-w-0 flex-1",
  pickerOverlayInput: "h-7 w-full min-w-0 rounded-md border px-2 text-xs font-bold outline-none border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] dark:border-white/[0.14] dark:bg-neutral-900 dark:text-white",
  pickerOverlayUnitSelect: "h-7 min-w-[5.75rem] shrink-0 rounded-md border px-2 text-xs font-bold outline-none border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] dark:border-white/[0.14] dark:bg-neutral-900 dark:text-white",
  footer: "border-t pt-4",
  footerContent: "flex items-center justify-between gap-3 max-sm:grid max-sm:grid-cols-1",
  footerSelectionRow: "flex min-w-0 flex-1 items-center gap-3",
  footerClearButton: "shrink-0 border-0 bg-transparent p-0 text-sm font-bold underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40 text-[#556145] hover:text-[#3C4A2E] dark:text-neutral-300 dark:hover:text-white",
  footerActions:
    "flex shrink-0 flex-wrap items-center justify-end gap-3 max-sm:flex-nowrap max-sm:[&>button]:min-w-0 max-sm:[&>button]:flex-1 max-sm:[&>button]:px-3 max-sm:[&>button]:text-sm",
  secondaryButton: controlStyles.secondaryButton,
  mobileCancelButton: `hidden max-sm:inline-flex ${controlStyles.secondaryButton}`,
  primaryButton: controlStyles.primaryButton,
  removeButton: controlStyles.removeButton,
  emptyState: `flex min-h-72 items-center justify-center ${radiusClasses.figma6} border p-8 text-center text-sm font-bold border-[#C8C0B5] bg-[#FAF7F2]/70 text-[#556145] dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-neutral-300`,
  statusError: `${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold border-red-700/25 bg-red-700/10 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200`,
  statusErrorWithOffset: () =>
    `mt-4 ${plannerPickerStyles.statusError}`,
};

export const groceryExportStyles = {
  modalBackdrop: modalLayoutClasses.centeredBackdrop,
  modalPanel: `grid ${sizeClasses.viewportModalMaxHeight} w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-6 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  header: "flex items-start justify-between gap-4",
  title: "text-2xl font-bold leading-tight",
  subtitle: "mt-1 text-sm font-semibold leading-[1.45] text-[#556145] dark:text-neutral-400",
  closeButton: controlStyles.modalCloseButton,
  bodyFrame: "grid min-h-0 gap-3",
  list: "grid max-h-[44vh] gap-4 overflow-y-auto pr-1",
  section: `grid gap-2 rounded-md border p-3 ${shadowClasses.subtle} ${surfaceClasses.panel}`,
  sectionTitle: "text-xs font-extrabold uppercase leading-tight text-[#556145] dark:text-neutral-300",
  itemButton: (selected: boolean) =>
    `grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${focusBase} ${siteColorClasses.focus} ${selected ? `${siteColorClasses.plannerControl}` : "border-[#7A8864]/20 bg-transparent text-[#556145] dark:border-white/[0.08] dark:text-neutral-400"}`,
  checkbox: (selected: boolean) =>
    `inline-flex h-5 w-5 items-center justify-center rounded-sm border text-xs font-bold ${selected ? "border-[#7A8864] bg-[#64714F] text-[#FAF7F2] dark:border-white dark:bg-white dark:text-neutral-950" : "border-[#7A8864]/35 text-transparent dark:border-white/[0.18]"}`,
  itemText: "min-w-0",
  itemName: "truncate text-sm font-bold leading-tight",
  itemSources: "mt-0 block truncate text-xs font-semibold leading-tight text-[#556145] dark:text-neutral-400",
  itemAmount: "whitespace-nowrap text-xs font-extrabold",
  emptyState: `rounded-md border p-6 text-center text-sm font-bold ${surfaceClasses.panel}`,
  statusError: plannerPickerStyles.statusError,
  statusSuccess: `${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold border-[#7A8864]/30 bg-[#7A8864]/10 text-[#556145] dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200`,
  footer: "flex flex-wrap items-center justify-between gap-4 border-t pt-4",
  countText: "text-sm font-bold text-[#556145] dark:text-neutral-300",
  actionGroup: "flex flex-wrap items-center justify-end gap-4",
  secondaryButton: controlStyles.secondaryButton,
  primaryButton: controlStyles.primaryButton,
  rulesBackdrop: "fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-4 py-6",
  rulesPanel: `grid max-h-[min(28rem,calc(100vh_-_48px))] w-full max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden ${radiusClasses.figma6} border p-5 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  rulesBody: "grid min-h-0 gap-3 overflow-y-auto pr-1",
  rulesFooter: "flex items-center justify-end gap-3 border-t pt-4",
  ruleTagGrid: "grid grid-cols-2 gap-2 max-sm:grid-cols-1",
  ruleTagButton: (selected: boolean) =>
    `min-h-9 rounded-md border px-3 py-2 text-left text-xs font-bold transition-colors ${focusBase} ${siteColorClasses.focus} ${selected ? "border-[#3C4A2E] bg-[#64714F] text-[#FAF7F2] shadow-[inset_0_0_0_1px_#FAF7F2] dark:border-emerald-300 dark:bg-emerald-950 dark:text-emerald-50 dark:shadow-[inset_0_0_0_1px_rgba(110,231,183,0.75)]" : "border-[#7A8864]/25 bg-[#FAF7F2] text-[#556145] hover:bg-[#E5D5BC] dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:bg-white/[0.08]"}`,
};
