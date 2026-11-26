import {
  controlStyles,
  focusBase,
  responsiveClasses,
  segmentedToggleStyles,
  shadowClasses,
  siteColorClasses,
  sizeClasses,
  surfaceClasses,
} from "../../styles/appStyles";

export const recipeBrowserStyles = {
  title: "whitespace-nowrap text-3xl font-bold leading-tight text-olive-dark dark:text-neutral-50",
  // On phones and tablets the Recipes / Ingredients switch is the page's title row, with Add beside it.
  headerTitle:
    "col-span-2 flex items-center max-desktop:sr-only",
  searchInput: controlStyles.compactSearchInput,
  headerControlsRow:
    "grid grid-cols-12 items-center max-desktop:flex max-desktop:gap-2",
  searchControls:
    "relative col-span-2 max-desktop:order-2 max-desktop:col-span-12 max-desktop:grid max-desktop:w-full max-desktop:grid-cols-[auto_minmax(0,1fr)] max-desktop:items-center max-desktop:gap-2",
  searchFieldShell:
    "relative w-full max-desktop:col-start-2 max-desktop:row-start-1",
  searchFieldInlineShell: "relative min-w-0 w-full",
  searchInputWithClear:
    "pr-9 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none max-desktop:h-11 max-desktop:pr-11 max-desktop:text-base",
  searchInputClearPadding:
    "pr-9 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
  searchClearButton: "absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md transition-colors max-desktop:right-0 max-desktop:h-11 max-desktop:w-11 [&_svg]:h-3 [&_svg]:w-3 max-desktop:[&_svg]:h-3.5 max-desktop:[&_svg]:w-3.5 text-olive-dark hover:bg-champagne hover:text-olive-dark dark:text-neutral-700 dark:hover:bg-neutral-300 dark:hover:text-neutral-950",
  headerActions:
    "col-span-10 flex items-center justify-end gap-3 pt-1 max-desktop:w-full max-desktop:flex-row-reverse max-desktop:gap-2 max-desktop:pt-0",
  headerActionButtonSlot: "flex shrink-0",
  headerModeToggleSlot: `${sizeClasses.thumbnailControlWidth} max-desktop:w-auto max-desktop:min-w-0 max-desktop:flex-1`,
  headerModeToggleStackedSlot: `hidden ${sizeClasses.thumbnailControlWidth} max-desktop:hidden`,
  filterButtonSlot:
    "absolute left-[calc(100%+0.75rem)] top-0 flex h-9 w-9 shrink-0 items-center gap-2 max-desktop:static max-desktop:col-start-1 max-desktop:row-start-1 max-desktop:h-11 max-desktop:w-auto",
  // Lets the search row stick to the page rather than to this short header element.
  browserHeader: "max-desktop:contents",
  // Docked under the header while the results scroll, instead of floating over them.
  searchFilterRow: `mt-3 grid grid-cols-12 items-start gap-3 max-desktop:sticky max-desktop:top-16 max-desktop:z-30 max-desktop:-mx-4 max-desktop:mt-2 max-desktop:flex max-desktop:flex-col max-desktop:gap-2 max-desktop:px-4 max-desktop:py-2 ${siteColorClasses.stickyBar}`,
  activeFilterChips: (
    mode: "recipes" | "ingredients",
    hasVisibleFilters: boolean,
  ) =>
    `col-span-10 flex min-h-9 flex-wrap items-start gap-2 max-desktop:order-1 max-desktop:col-span-12 ${
      mode === "recipes" ? "pl-12 max-desktop:pl-0" : ""
    } ${hasVisibleFilters ? "" : "max-desktop:hidden"}`,
  browserBodyGrid: "mt-3 grid grid-cols-12 gap-3 max-sm:mt-3",
  embeddedBrowser: "grid min-h-0 gap-3",
  embeddedSearchFilterRow: "grid gap-3",
  embeddedSearchControls:
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
  embeddedFilterButtonSlot: "flex items-center gap-2",
  embeddedBrowserBodyGrid:
    "grid min-h-0 grid-cols-12 gap-3 max-desktop:grid-cols-1",
  embeddedResultsWithFilters:
    "col-span-10 min-h-0 overflow-y-auto pr-1 max-desktop:col-span-1",
  embeddedRecipeGrid:
    "grid grid-cols-3 gap-3 min-[641px]:max-desktop:grid-cols-4 max-md:grid-cols-2 max-[380px]:grid-cols-1",
  embeddedCategoryFilterButton: `inline-flex h-9 w-9 items-center justify-center rounded-md border p-0 ${shadowClasses.subtle} transition-colors ${siteColorClasses.cookbookFilterButton}`,
  filterButton: `inline-flex h-9 w-9 items-center justify-center rounded-md border max-desktop:h-11 max-desktop:w-11 max-desktop:[&_svg]:h-5 max-desktop:[&_svg]:w-5 ${shadowClasses.subtle} transition-colors ${siteColorClasses.cookbookFilterButton}`,
  categoryFilterButton: `hidden h-9 w-9 items-center justify-center rounded-md border p-0 max-desktop:h-11 max-desktop:w-11 max-desktop:[&_svg]:h-5 max-desktop:[&_svg]:w-5 ${shadowClasses.subtle} transition-colors max-desktop:inline-flex ${siteColorClasses.cookbookFilterButton}`,
  filterChip: "inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition-colors bg-champagne text-body hover:bg-stone dark:bg-white/[0.10] dark:hover:bg-white/[0.16]",
  clearFilterChip: "inline-flex items-start rounded-md px-0 py-1 text-[10px] font-bold leading-none transition-colors text-muted hover:text-olive-dark dark:hover:text-white",
  ingredientPicker: `fixed z-[120] w-72 max-w-[calc(100vw_-_24px)] rounded-md border p-3 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  ingredientPickerSearch: `h-9 w-full rounded-md border px-3 text-sm font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${surfaceClasses.field}`,
  ingredientPickerEmpty: "rounded-md px-3 py-4 text-sm font-semibold bg-champagne/45 text-muted dark:bg-white/[0.04]",
  ingredientPickerList:
    "mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1",
  ingredientPickerItem: "h-9 px-3",
  addButton: `inline-flex h-9 w-32 items-center justify-center gap-1 rounded-md border px-3 text-xs font-extrabold ${shadowClasses.subtle} transition-colors max-desktop:h-[3.125rem] max-desktop:w-[3.125rem] max-desktop:px-0 max-desktop:text-xl ${siteColorClasses.cookbookAddButton}`,
  addButtonLabel: "max-desktop:sr-only",
  modalBackdrop: `fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
  modalPanel: `grid ${sizeClasses.modalOuterMaxHeight} w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-md border p-6 ${responsiveClasses.mobileModalPanel} ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  modalCloseButton: controlStyles.modalCloseButton,
  modalModeSwitch: "flex h-9 w-full overflow-hidden rounded-md border p-1 border-olive/35 bg-olive-surface dark:border-white/[0.08] dark:bg-black/50",
  modalModeOption: (selected: boolean) =>
    `flex h-7 min-w-0 flex-1 items-center justify-center rounded-md px-4 text-xs font-semibold transition-colors ${selected ? "bg-ivory text-olive-dark dark:bg-white/[0.14] dark:text-white" : "text-ivory hover:text-ivory dark:text-neutral-400 dark:hover:text-white"}`,
  modalControlsRow: "mt-4 grid w-full gap-3",
  modalHeader: "flex flex-wrap items-start justify-between gap-3 max-sm:gap-2",
  modalHeaderIntro: "flex items-start justify-between gap-4 max-sm:gap-3",
  modalTitle: "text-2xl font-bold leading-tight max-sm:text-xl",
  modalCloseAligned: () =>
    `${recipeBrowserStyles.modalCloseButton} ml-auto`,
  form: "grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4",
  formBodyScrollArea: `${sizeClasses.modalFormBodyMaxHeight} ${sizeClasses.modalFormBodyMobileMaxHeight} grid gap-4 overflow-y-auto pr-1`,
  formGrid: "grid grid-cols-2 gap-4 max-md:grid-cols-1",
  fieldHeaderRow:
    "flex items-center justify-between gap-3 max-sm:items-start",
  inlineHelperButton: "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border px-3 text-[11px] font-bold transition-colors max-sm:h-8 max-sm:px-2 max-sm:text-[10px] border-line bg-champagne/45 text-body hover:bg-stone/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]",
  recipeCreateScrollArea: "grid gap-4 rounded-md border p-3 border-line-faint bg-champagne/20 dark:bg-white/[0.025]",
  ingredientCreateScrollArea: "grid gap-4 rounded-md border p-3 border-line-faint bg-champagne/20 dark:bg-white/[0.025]",
  createFormTopGrid:
    "grid grid-cols-[minmax(0,1fr)_minmax(220px,280px)] gap-4 max-md:grid-cols-1",
  createFormPrimaryFields: "grid min-w-0 content-start gap-4",
  createImageField:
    "relative mt-6 grid min-w-0 content-start max-md:mt-0 max-md:gap-2 md:pt-0",
  createImageLabel: "absolute -top-6 left-0 max-md:static",
  createImageControl: "max-md:mt-0",
  field: "grid min-w-0 gap-2",
  label: "text-xs font-bold text-secondary",
  requiredMark: "text-red-700 dark:text-red-300",
  textField: `${controlStyles.formField}`,
  customSelectWrap: "relative min-w-0 w-full",
  customSelectButton: `${controlStyles.formField} flex w-full items-center justify-between gap-3 text-left`,
  customSelectMenu: `absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 grid max-h-56 gap-1 overflow-y-auto rounded-md border p-2 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  customSelectOption: (selected: boolean) =>
    `grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold transition-colors ${selected ? "bg-ivory text-olive-dark dark:bg-white/[0.12] dark:text-white" : "text-secondary hover:bg-ivory dark:hover:bg-white/[0.08] dark:hover:text-white"}`,
  customSelectDeleteButton: "flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold transition-colors text-red-900 hover:bg-red-800/12 dark:text-red-200 dark:hover:bg-red-500/20",
  numberField: "relative",
  numberFieldInput: `${controlStyles.formField} w-full pr-10`,
  numberFieldSuffix: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted",
  colorFieldButton: `${controlStyles.formField} flex w-full cursor-pointer items-center justify-between gap-3 text-left`,
  colorSwatch: "h-5 w-5 shrink-0 rounded-md border border-white/25",
  colorPickerPanel: "grid gap-3 rounded-md border p-3 border-line bg-champagne/35 dark:bg-white/[0.04]",
  colorPickerInput:
    "h-12 w-full cursor-pointer rounded-md border-0 bg-transparent p-0",
  createOptionPanel: "grid gap-3 rounded-md border p-3 border-line bg-champagne/35 dark:bg-white/[0.04]",
  textArea: `${controlStyles.textArea} max-sm:h-9 max-sm:min-h-9 max-sm:resize-none max-sm:px-3 max-sm:py-2 max-sm:text-sm max-sm:leading-tight`,
  ratingBody: "grid gap-3",
  ratingStars: "flex flex-wrap items-center gap-1",
  ratingStar: (filled: boolean) =>
    `inline-flex h-10 w-10 items-center justify-center rounded-md text-2xl leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${focusBase} ${siteColorClasses.focus} ${filled ? "text-[#B7791F] dark:text-amber-400" : "text-neutral-300 hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400"}`,
  ratingNoteRow: "flex flex-wrap items-center gap-2",
  ratingNoteInput: `${controlStyles.formField} h-10 flex-1 min-w-48`,
  ratingButton: `${controlStyles.secondaryButton} h-10 min-w-0 px-4 text-sm`,
  helperText: "text-xs font-semibold leading-[1.45] text-muted",
  inlineHint: "ml-2 text-[10px] font-semibold text-muted",
  checkboxGrid:
    "grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-md p-2 max-md:grid-cols-1",
  tagCheckboxGrid:
    "grid grid-cols-3 gap-2 rounded-md p-2 max-md:grid-cols-2 max-sm:grid-cols-1",
  groupedTagPanel: "grid gap-3 rounded-md p-2",
  groupedTagSection: "grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 border-olive/25 dark:border-white/[0.10]",
  groupedTagTitle: "text-[11px] font-extrabold uppercase tracking-wide border-olive/25 text-muted dark:border-white/[0.10]",
  groupedTagGrid:
    "grid grid-cols-3 gap-2 max-md:grid-cols-2 max-sm:grid-cols-1",
  recipeIngredientPickerGrid: "grid gap-2 overflow-y-auto rounded-md p-2",
  desktopIngredientPicker: "grid gap-2 max-sm:hidden",
  mobileIngredientSummary: "hidden gap-3 max-sm:grid",
  selectedIngredientCapsules:
    "flex flex-wrap gap-2 max-sm:grid max-sm:grid-cols-1",
  selectedIngredientCapsule: `inline-flex h-8 max-w-full items-center rounded-md border px-3 text-xs font-bold text-neutral-950 ${shadowClasses.subtle} border-line bg-ivory dark:bg-white/[0.72]`,
  selectedIngredientSummaryItem: `grid max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border p-1.5 ${shadowClasses.subtle} max-sm:grid-cols-1 border-line bg-champagne/35 dark:bg-white/[0.04]`,
  selectedIngredientThumbnail: "min-w-0 max-w-44 max-sm:max-w-full",
  selectedIngredientMeta: "grid min-w-20 gap-0.5 text-right text-[10px] font-bold leading-tight max-sm:grid-cols-2 max-sm:text-left text-secondary",
  selectedComponentThumbnails: "flex flex-wrap gap-2",
  selectedComponentThumbnail: "w-20 max-sm:w-16",
  selectedComponentThumbnailCard:
    "[&_h3]:text-xs [&_p]:text-[9px] max-sm:[&_h3]:text-[10px] max-sm:[&_p]:text-[8px]",
  componentRecipeSelected: `after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-md after:ring-2 after:ring-inset ${siteColorClasses.selectedThumbnailRing}`,
  conversionHelperIntro: "text-sm font-semibold leading-snug text-secondary",
  conversionHelperSource: "text-xs font-semibold leading-snug text-muted",
  conversionHelperSourceLink: "font-bold underline underline-offset-2 text-body hover:text-olive-ink dark:hover:text-white",
  conversionSection: "grid gap-2 rounded-md border p-3 border-line-faint bg-champagne/25 dark:bg-white/[0.035]",
  conversionSectionTitle: "text-sm font-bold text-olive-dark dark:text-neutral-100",
  conversionList: "grid gap-1.5",
  conversionRow: "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold max-sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-sm:[&>button]:col-span-3 max-sm:[&>button]:justify-self-end bg-ivory/65 text-body dark:bg-white/[0.04]",
  conversionSource: "min-w-0 text-left",
  conversionArrow: "text-muted",
  conversionTarget: "min-w-0 text-right",
  conversionRuleForm: "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3 max-sm:grid-cols-1",
  inlineTextButton: "border-0 bg-transparent p-0 text-xs font-bold underline underline-offset-2 transition-colors text-secondary hover:text-olive-ink dark:hover:text-white",
  recipeIngredientPickerRow:
    "grid grid-cols-[auto_minmax(0,1fr)_6rem_8rem_10rem] items-center gap-2 max-desktop:grid-cols-[auto_minmax(0,1fr)_6rem] max-md:grid-cols-[auto_minmax(0,1fr)] max-sm:gap-y-2",
  recipeIngredientControlGrid:
    "contents max-sm:col-span-2 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2",
  recipeIngredientPreparationField: "max-sm:col-span-2",
  compactTextField: `${controlStyles.compactTextField}`,
  checkboxGridPanel: "bg-champagne/45 dark:bg-white/[0.04]",
  detailsToggle: "inline-flex h-9 w-fit cursor-pointer items-center justify-center rounded-md border px-4 text-xs font-bold transition-colors border-line bg-champagne/45 text-body hover:bg-stone/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]",
  detailsToggleFull: "inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-md border px-6 text-base font-semibold transition-colors border-line bg-champagne/45 text-body hover:bg-stone/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]",
  mobileFormActionRow: "hidden max-sm:grid max-sm:grid-cols-2 max-sm:gap-2",
  mobileFormActionButton: "max-sm:h-11 max-sm:min-w-0 max-sm:px-3 max-sm:text-sm",
  desktopTagSection: "max-sm:hidden",
  imageUploadActionStack:
    "absolute left-1/2 top-1/2 z-10 grid w-fit -translate-x-1/2 -translate-y-1/2 gap-2 max-desktop:static max-desktop:translate-x-0 max-desktop:translate-y-0 max-sm:absolute max-sm:left-1/2 max-sm:top-1/2 max-sm:w-[min(10rem,calc(100%-1rem))] max-sm:-translate-x-1/2 max-sm:-translate-y-1/2",
  imageUploadFloatingButton: `inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-center text-[10px] font-bold leading-none ${shadowClasses.subtle} transition-colors max-sm:w-full max-sm:px-2 max-sm:text-xs border-line bg-ivory/90 text-body hover:bg-ivory dark:bg-neutral-950/85 dark:hover:bg-neutral-950`,
  imageCaptureButton: `hidden h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-2 text-center text-xs font-bold leading-none ${shadowClasses.subtle} transition-colors border-line bg-ivory/90 text-body hover:bg-ivory dark:bg-neutral-950/85 dark:hover:bg-neutral-950`,
  imageUploadIcon: "h-4 w-4",
  desktopUploadLabel: "max-sm:hidden",
  mobileUploadLabel: "hidden max-sm:inline",
  compactIngredientImageControl:
    "relative grid max-md:min-h-0 max-md:grid-cols-[5.5rem_minmax(0,8fr)] max-md:items-center max-md:gap-3",
  compactIngredientImagePreview: `flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border ${shadowClasses.subtle} max-md:h-[5.5rem] max-md:min-h-0 max-md:w-[5.5rem] border-stone bg-ivory dark:border-white/[0.14] dark:bg-white/[0.08]`,
  compactIngredientImage: "",
  compactIngredientImageFallback:
    "text-xl font-black leading-none opacity-55 max-md:text-xs",
  compactIngredientImageButton: () =>
    `${recipeBrowserStyles.imageUploadFloatingButton} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-md:static max-md:translate-x-0 max-md:translate-y-0`,
  detailsPanel: `grid content-start gap-4 rounded-md border p-3 ${surfaceClasses.panel}`,
  formActions:
    "flex flex-wrap items-center justify-end gap-3 pt-2 max-sm:flex-nowrap",
  formActionButton:
    "whitespace-nowrap max-sm:h-11 max-sm:min-w-0 max-sm:flex-1 max-sm:px-2 max-sm:text-[13px]",
  nestedModalBackdrop: `fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
  nestedIngredientModalPanel: `grid ${sizeClasses.modalOuterMaxHeight} w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-md border p-6 max-sm:max-h-[calc(100vh_-_16px)] max-sm:p-4 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  nestedIngredientModalBody: `${sizeClasses.modalFormBodyMaxHeight} ${sizeClasses.modalFormBodyMobileMaxHeight} grid min-h-0 gap-3 overflow-y-auto pr-1`,
  nestedDialogForm: "grid gap-3",
  primaryButton: controlStyles.primaryButton,
  detailHeaderEditButton: () =>
    `${controlStyles.primaryButton} ${recipeBrowserStyles.formActionButton}`,
  detailHeaderRemoveButton: () =>
    `${controlStyles.removeButton} ${recipeBrowserStyles.formActionButton}`,
  // The recipe view is a full-height sheet, the whole screen on a phone, with one scroll area (AUDIT D5).
  detailModalBackdrop: "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 max-sm:p-0",
  detailModalPanel: `relative grid h-[calc(100dvh_-_2rem)] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-md border p-6 max-sm:h-[100dvh] max-sm:max-w-none max-sm:gap-3 max-sm:rounded-none max-sm:border-0 max-sm:p-4 max-sm:pb-[calc(1rem+env(safe-area-inset-bottom))] ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  detailCloseButton: () =>
    `${recipeBrowserStyles.modalCloseButton} ml-auto`,
  detailBodyScrollArea: "grid min-h-0 content-start gap-4 overflow-y-auto overscroll-contain pr-1",
  detailFrameHeader: "flex items-start justify-between gap-4",
  detailHeaderDescription: "mt-2",
  detailHeaderShell: "grid gap-2 max-sm:pr-12",
  detailHeaderTitleRow: "flex flex-wrap items-center gap-2",
  detailHeaderActionRow:
    "flex flex-wrap items-center justify-end gap-3 pt-2 max-sm:flex-nowrap",
  detailHeaderTagList: "flex min-w-0 flex-wrap items-center gap-2",
  detailHeaderTitle: "min-w-0 text-2xl font-bold leading-tight",
  detailHeaderBackButton: () =>
    `${controlStyles.secondaryButton} ${recipeBrowserStyles.formActionButton}`,
  secondaryButton: controlStyles.secondaryButton,
  statusError: "rounded-md border px-3 py-2 text-sm font-semibold border-red-700/25 bg-red-700/10 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200",
  statusErrorWithOffset: () =>
    `mt-4 ${recipeBrowserStyles.statusError}`,
  cropPreview: "relative aspect-square w-full overflow-hidden rounded-md border max-desktop:h-[5.5rem] max-desktop:w-[5.5rem] max-sm:h-auto max-sm:w-full border-line bg-ivory dark:bg-neutral-900",
  tabs: `${segmentedToggleStyles.shell()} max-desktop:h-[3.125rem] max-desktop:p-0.5`,
  tab: (selected: boolean) =>
    `${segmentedToggleStyles.option(selected)}`,
  filterRail: `col-span-2 rounded-md p-3 ${shadowClasses.subtle} max-desktop:hidden bg-champagne/45 dark:bg-white/[0.04]`,
  filterPanel: "grid max-h-[48vh] gap-0 overflow-y-auto rounded-md p-3 max-sm:max-h-[40vh] bg-champagne/45 dark:bg-white/[0.04]",
  filterGroup: "border-b pb-3 pt-3 first:pt-0 last:border-b-0 last:pb-0 border-olive/25 dark:border-white/[0.16]",
  filterLegend: "text-sm font-bold text-olive-dark dark:text-neutral-100",
  filterGroupHeader: "flex items-center justify-between gap-2",
  filterOptionList: "mt-2 flex flex-col gap-1",
  groupedFilterOptionList: "mt-2 grid gap-3",
  groupedFilterSection: "grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 border-olive/25 dark:border-white/[0.10]",
  checkboxLabel: "flex items-center gap-2 text-xs font-semibold text-secondary",
  disabledFilterOption: "cursor-not-allowed opacity-40 text-olive-dark dark:text-neutral-500",
  checkbox: "h-4 w-4 rounded border-neutral-400 accent-neutral-500",
  addTagButton: "flex items-center justify-start gap-2 rounded-md border-0 bg-transparent p-0 text-left text-xs font-semibold transition-colors before:flex before:h-4 before:w-4 before:items-center before:justify-center before:rounded before:text-[10px] before:font-bold before:content-['+'] disabled:cursor-not-allowed disabled:opacity-45 text-secondary hover:text-olive before:bg-olive-surface before:text-ivory dark:hover:text-neutral-100 dark:before:bg-white/[0.10] dark:before:text-neutral-200",
  tagCategorySelectRow:
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-sm:grid-cols-1",
  manageTagModeRow: "flex justify-end max-sm:justify-start",
  manageTagsList: "grid gap-3",
  manageTagCategoryShell: "grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-2 max-sm:grid-cols-12",
  manageTagCategoryControlsRail: "grid content-start justify-items-center gap-1 max-sm:col-span-2 max-sm:w-full",
  manageTagCollapseButton: `mt-4 flex h-5 w-5 items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 max-sm:mt-0 max-sm:h-8 max-sm:w-full ${siteColorClasses.focus} ${siteColorClasses.plannerCounterAccent}`,
  manageTagCollapseIcon: (collapsed: boolean) =>
    `flex h-5 w-5 items-center justify-center transition-transform ${
      collapsed ? "" : "rotate-90"
    }`,
  manageTagCollapseSvg: "h-3.5 w-3.5 fill-current",
  manageTagCategory: (selected = false) =>
    `grid cursor-pointer gap-3 rounded-md border p-3 transition-colors max-sm:col-span-10 ${selected ? "border-olive/65 dark:border-white/[0.24]" : "border-line"} bg-champagne/35 dark:bg-white/[0.04]`,
  manageTagDivider: (emphasis: "category" | "item" = "item") =>
    emphasis === "category" ? "border-olive/35 dark:border-white/[0.16]" : "border-olive/18 dark:border-white/[0.08]",
  manageTagCategoryRow: (collapsed = false) =>
    `grid gap-2 ${collapsed ? "" : "border-b pb-3"}`,
  manageTagVisibilityRow:
    "grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2 max-sm:grid-cols-[2rem_minmax(0,1fr)] max-sm:items-start",
  manageTagCategoryEditRow:
    "grid grid-cols-[4rem_minmax(0,1fr)_5.25rem_5.25rem] items-center gap-2 max-sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] max-sm:items-start [&>div]:max-sm:row-span-2 [&>div]:max-sm:grid-cols-1 [&>input]:max-sm:col-span-2 [&>input]:max-sm:col-start-2 [&>button]:max-sm:row-start-2 [&>button]:max-sm:w-full [&>button:nth-of-type(1)]:max-sm:col-start-2 [&>button:nth-of-type(2)]:max-sm:col-start-3",
  manageTagVisibilityGroup: "col-start-2 grid w-56 max-w-full grid-cols-2 gap-1 justify-self-end rounded-md border p-1 max-sm:justify-self-start border-olive/35 bg-champagne/45 dark:border-white/[0.12] dark:bg-white/[0.05]",
  manageTagVisibilityButton: (selected: boolean) =>
    `inline-flex h-7 items-center justify-center rounded-md border px-2 text-xs font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${siteColorClasses.focus} ${selected ? "border-olive/45 bg-ivory text-olive-dark dark:border-white/[0.18] dark:bg-neutral-100 dark:text-neutral-950" : "border-transparent bg-transparent text-muted hover:text-olive-dark dark:hover:text-neutral-100"}`,
  manageTagList: "grid",
  manageTagAddRow: "px-3 py-2 pl-6 max-sm:pl-2",
  manageTagRow:
    "grid grid-cols-[4rem_minmax(0,1fr)_5.25rem_5.25rem] items-center gap-2 border-b py-2 pl-6 last:border-b-0 last:pb-0 max-sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] max-sm:items-start max-sm:gap-y-1.5 max-sm:pl-2 [&>div:first-child]:max-sm:row-span-2 [&>div:first-child]:max-sm:grid-cols-1 [&>div:first-child]:max-sm:self-start [&>input]:max-sm:col-span-2 [&>input]:max-sm:col-start-2 [&>button]:max-sm:row-start-2 [&>button]:max-sm:w-full [&>button:nth-of-type(1)]:max-sm:col-start-2 [&>button:nth-of-type(2)]:max-sm:col-start-3",
  manageTagOrderControls: "grid grid-cols-2 gap-1",
  manageTagIconButton: "flex h-8 w-full min-w-0 items-center justify-center rounded-md border text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:hover:bg-transparent border-olive/35 bg-ivory text-body hover:bg-champagne/75 max-sm:text-olive-dark dark:border-white/[0.14] dark:bg-white/[0.06] dark:hover:bg-white/[0.11] dark:max-sm:bg-transparent dark:max-sm:text-neutral-50 dark:max-sm:hover:bg-transparent",
  manageTagTextField: `${controlStyles.compactTextField} w-full text-sm`,
  manageTagSystemNameField: `${controlStyles.compactTextField} grid h-8 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm font-semibold max-sm:col-span-2 max-sm:col-start-2 max-sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)] max-sm:gap-1.5 text-secondary`,
  manageTagSystemName: "min-w-0 truncate",
  manageTagSystemMeta: "min-w-0 max-w-28 truncate justify-self-end text-xs font-semibold max-sm:max-w-24 text-muted",
  manageTagActionButton: `inline-flex h-8 w-full min-w-0 items-center justify-center rounded-md border px-2 text-sm font-semibold outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${siteColorClasses.focus} border-line bg-transparent text-body hover:bg-champagne/55 dark:hover:bg-white/[0.08]`,
  manageTagRemoveButton: (transparent = false) =>
    transparent ? `inline-flex h-8 w-full min-w-0 items-center justify-center rounded-md border border-transparent bg-transparent px-2 text-sm font-semibold opacity-35 outline-none transition-colors disabled:cursor-not-allowed ${siteColorClasses.focus} text-muted` : `inline-flex h-8 w-full min-w-0 items-center justify-center rounded-md border px-2 text-sm font-semibold outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${siteColorClasses.focus} border-red-950 bg-red-950 text-ivory hover:bg-red-900 dark:text-white`,
  resultsWithFilters: "col-span-10 max-desktop:col-span-12",
  recipeGrid: `grid grid-cols-3 gap-3 min-[641px]:max-desktop:grid-cols-4 ${sizeClasses.portableBottomNavOffset} max-md:grid-cols-2 max-[380px]:grid-cols-1`,
  ingredientGrid: `grid grid-cols-3 items-start gap-3 max-desktop:grid-cols-2 ${sizeClasses.portableBottomNavOffset} max-sm:grid-cols-1`,
  emptyFilterChipSlot: "h-9",
  recipeCard: `${shadowClasses.subtle} ring-1 ring-olive/20 dark:ring-white/[0.08]`,
  emptyState: "flex min-h-80 flex-col items-center justify-center rounded-md border p-8 text-center max-sm:min-h-56 max-sm:p-5 border-line-faint bg-ivory/70 text-body dark:bg-white/[0.035]",
  emptyStateTitle: "text-2xl font-bold leading-[1.15] max-sm:text-xl",
  emptyStateBody: "mt-2 max-w-xl text-base leading-[1.5] max-sm:text-sm",
  detailShell: "mt-2 grid gap-6 max-sm:mt-0 max-sm:gap-4",
  recipeDetailHeroGrid:
    "grid grid-cols-[minmax(200px,280px)_minmax(0,1fr)] items-start gap-6 max-md:grid-cols-1 max-md:gap-4",
  recipeDetailImageFrame:
    "aspect-square overflow-hidden rounded-md bg-neutral-800 max-md:aspect-[16/9] max-md:w-full",
  detailImage: "h-full w-full object-cover",
  detailImageFallback:
    "flex h-full w-full items-center justify-center px-4 text-center text-sm font-bold text-neutral-400",
  recipeDetailDescriptionWrap: "grid content-start",
  recipeDetailDescriptionPanel:
    "content-start",
  // Ingredients beside the method on wide screens, above it on narrow ones; both listed in full.
  recipeDetailSplitGrid: "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-6 max-md:grid-cols-1 max-md:gap-4",
  detailSectionHeader: "flex flex-wrap items-center justify-between gap-3",
  detailSectionTitleRow: "flex flex-wrap items-baseline gap-2",
  detailSectionTitle: "text-sm font-bold uppercase tracking-wide",
  detailSectionSubtitle: "text-xs font-semibold normal-case tracking-normal text-muted",
  detailText:
    "self-start whitespace-pre-wrap text-left text-[15px] font-semibold leading-[1.6]",
  detailTextScrollable:
    "self-start whitespace-pre-wrap text-left text-[15px] font-semibold leading-[1.6]",
  detailTextMetaHeader: "flex flex-wrap items-baseline justify-between gap-3",
  detailRow: "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-semibold bg-champagne/45 text-body dark:bg-white/[0.05]",
  detailRows: "grid gap-2",
  detailIngredientSections: "grid gap-4",
  detailIngredientSection: "grid gap-2",
  detailIngredientSectionTitle: "text-[11px] font-extrabold uppercase tracking-wide text-muted",
  detailIngredientSectionTitleButton: `cursor-pointer border-0 bg-transparent p-0 text-[11px] font-extrabold uppercase tracking-wide underline-offset-2 hover:underline ${siteColorClasses.plannerCounterAccent}`,
  detailComponentGroups: "grid gap-3",
  detailComponentGroup: "grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 border-line-faint",
  detailComponentGrid: "grid grid-cols-3 gap-2 max-sm:grid-cols-2",
  detailComponentThumbnail: "min-w-0",
  detailRowLabel: "font-bold",
  detailRowValue: "shrink-0",
  detailIngredientRow: "grid min-h-14 w-full grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2 rounded-md p-1.5 text-left text-sm font-semibold transition-colors bg-champagne/45 text-body hover:bg-champagne/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.09]",
  detailIngredientImageFrame: "flex aspect-square h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-ivory dark:bg-white/[0.08]",
  detailIngredientImage: "h-full w-full object-cover",
  detailIngredientImageFallback:
    "text-xs font-black leading-none",
  detailIngredientContent: "grid min-w-0 gap-1",
  detailIngredientName:
    "min-w-0 break-words text-sm font-bold leading-tight",
  detailIngredientMetaRow:
    "grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2",
  detailIngredientAmount:
    "min-w-0 truncate text-left text-xs font-semibold",
  detailIngredientPreparation:
    "min-w-0 truncate text-right text-xs font-bold",
  ingredientDetailOverviewGrid: "grid grid-cols-2 gap-3",
  ingredientDetailImageFrame: `flex aspect-square min-h-0 w-full items-center justify-center overflow-hidden rounded-md border ${shadowClasses.subtle} border-stone bg-ivory dark:border-white/[0.14] dark:bg-white/[0.08]`,
  ingredientDetailImage: "h-full w-full object-cover",
  ingredientDetailImageFallback: "text-2xl font-black leading-none opacity-70",
  ingredientDetailMetaStack: "grid content-start gap-3",
  ingredientDetailMetaField: "grid gap-1 rounded-md px-3 py-2 text-sm font-semibold bg-champagne/45 text-body dark:bg-white/[0.05]",
  ingredientDetailMetaLabel: "text-[10px] font-extrabold uppercase tracking-wide text-muted",
  ingredientDetailMetaValue: "min-w-0 truncate",
  detailChipSection: "grid gap-2",
  detailChipSectionCompact: "grid gap-1",
  detailChipList: "flex flex-wrap gap-2",
  nutritionGrid: "grid gap-3",
  nutritionGridGroupWrap: "grid gap-2",
  nutritionGridGroupTitle: "text-xs font-extrabold uppercase tracking-wide text-secondary",
  nutritionGridGroup: "grid grid-cols-2 gap-2 max-sm:grid-cols-1",
  scaleLabel: "flex items-center gap-2",
  scaleField: "w-20",
  scaleInput: "w-full pr-6 max-sm:h-11 max-sm:text-base",
  imageCropper:
    "relative grid gap-3 max-desktop:grid-cols-[5.5rem_minmax(0,8fr)] max-desktop:items-center max-sm:grid-cols-1 max-sm:items-start",
  hiddenFileInput: "sr-only",
  cropImage: "h-full w-full object-cover",
  cropFallback:
    "flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold",
  cropControls: "grid gap-3 max-sm:gap-2",
  cropConfirmButton: "max-sm:h-8 max-sm:min-w-0 max-sm:px-3 max-sm:text-xs",
  sliderField: "grid gap-1 text-xs font-bold",
  createOptionActions: "flex items-center justify-end gap-3",
  customSelectOptionLabel: "min-w-0 truncate",
  colorPickerActions: "flex items-center justify-end gap-3",
  filterIcon: "h-6 w-6",
  categoryFilterBackdrop: `fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
  categoryFilterPanel: `grid max-h-[64vh] w-full max-w-md grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-md border p-6 max-sm:max-h-[56vh] max-sm:p-4 ${shadowClasses.overlay} ${surfaceClasses.modal}`,
  categoryFilterHeader: "flex items-center justify-between gap-3",
  categoryFilterBody: "min-h-0 overflow-y-auto",
  recipeIngredientThumbnailCompact: "",
  nutritionEditorGroup: "grid gap-2 rounded-md border p-3 border-line-faint bg-ivory/55 dark:bg-white/[0.035]",
  nutritionEditorActionRow: "flex items-center justify-start",
  nutritionEditorGroupButton: "flex w-full items-center justify-between gap-3 text-left text-sm font-semibold leading-tight transition-opacity hover:opacity-80 text-secondary",
  nutritionEditorGroupIcon: (isOpen: boolean) =>
    `flex h-5 w-5 shrink-0 items-center justify-center transition-transform ${
      isOpen ? "rotate-90" : ""
    }`,
  nutritionEditorGroupSvg: "h-3.5 w-3.5 fill-current",
  nutritionEditorSection: "grid grid-cols-2 gap-4 max-md:grid-cols-1",
  matvareSearchForm: "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]",
  matvareCandidateButton: `grid gap-1 rounded-md border p-3 text-left transition-colors ${siteColorClasses.focus} border-line bg-ivory/70 text-olive-dark hover:bg-champagne/55 dark:bg-white/[0.05] dark:text-neutral-100 dark:hover:bg-white/[0.10]`,
  matvareCandidateName: "text-sm font-extrabold leading-tight",
  matvareCandidateMeta: "text-xs font-bold text-secondary",
  matvareCandidateMacros: "text-xs font-semibold leading-[1.4] text-muted",
  nutritionSeparator: "h-px w-full bg-stone dark:bg-white/[0.10]",
};

export function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
