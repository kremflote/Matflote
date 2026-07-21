import {
  controlStyles,
  responsiveClasses,
  segmentedToggleStyles,
  shadowClasses,
  siteColorClasses,
  sizeClasses,
  surfaceClasses,
  type SiteTheme,
} from "../../styles/appStyles";

export const recipeBrowserStyles = {
  title: (theme: SiteTheme) =>
    `whitespace-nowrap text-3xl font-bold leading-tight ${theme === "paletteLight" ? "text-[#556145]" : siteColorClasses[theme].plannerCounterAccent}`,
  headerTitle:
    "col-span-2 flex items-center max-[1100px]:order-2 max-[1100px]:col-span-12 max-[1100px]:justify-start",
  searchInput: controlStyles.compactSearchInput,
  headerControlsRow:
    "grid grid-cols-12 items-center max-[1100px]:mt-0 max-[1100px]:gap-0",
  searchControls:
    "relative col-span-2 max-[1100px]:order-2 max-[1100px]:col-span-12 max-[1100px]:grid max-[1100px]:w-full max-[1100px]:grid-cols-[auto_minmax(0,1fr)] max-[1100px]:items-center max-[1100px]:gap-2",
  searchFieldShell:
    "relative w-full max-[1100px]:col-start-2 max-[1100px]:row-start-1",
  searchInputWithClear:
    "pr-9 min-[641px]:max-[1100px]:h-11 min-[641px]:max-[1100px]:pr-10 min-[641px]:max-[1100px]:text-base",
  searchClearButton: (theme: SiteTheme) =>
    `absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md transition-colors min-[641px]:max-[1100px]:h-6 min-[641px]:max-[1100px]:w-6 [&_svg]:h-3 [&_svg]:w-3 min-[641px]:max-[1100px]:[&_svg]:h-3.5 min-[641px]:max-[1100px]:[&_svg]:w-3.5 ${
      theme === "dark"
        ? "text-neutral-700 hover:bg-neutral-300 hover:text-neutral-950"
        : theme === "paletteLight"
          ? "text-[#7A8864] hover:bg-[#E5D5BC] hover:text-[#556145]"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
    }`,
  headerActions:
    "col-span-10 flex items-center justify-end gap-3 pt-1 max-[1100px]:contents",
  headerActionButtonSlot: "flex shrink-0 max-[1100px]:contents",
  headerModeToggleSlot: `${sizeClasses.thumbnailControlWidth} max-[1100px]:hidden`,
  headerModeToggleStackedSlot: `hidden ${sizeClasses.thumbnailControlWidth} max-[1100px]:hidden`,
  mobileModeToggleDock:
    "hidden max-[1100px]:fixed max-[1100px]:inset-x-0 max-[1100px]:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] max-[1100px]:z-[55] max-[1100px]:flex",
  mobileModeToggleInner: "w-full",
  filterButtonSlot:
    "absolute left-[calc(100%+0.75rem)] top-0 flex h-9 w-9 shrink-0 items-center gap-2 max-[1100px]:static max-[1100px]:col-start-1 max-[1100px]:row-start-1 max-[1100px]:w-auto max-sm:h-9 max-sm:w-auto",
  searchFilterRow:
    "mt-3 grid grid-cols-12 items-start gap-3 max-[1100px]:fixed max-[1100px]:left-6 max-[1100px]:right-[5.25rem] max-[1100px]:bottom-30 max-[1100px]:z-[55] max-[1100px]:m-0 max-[1100px]:flex max-[1100px]:flex-col max-[1100px]:gap-2 max-sm:left-4 max-sm:right-[3.75rem]",
  activeFilterChips: (
    mode: "recipes" | "ingredients",
    hasVisibleFilters: boolean,
  ) =>
    `col-span-10 flex min-h-9 flex-wrap items-start gap-2 max-[1100px]:order-1 max-[1100px]:col-span-12 ${
      mode === "recipes" ? "pl-12 max-[1100px]:pl-0" : ""
    } ${hasVisibleFilters ? "" : "max-[1100px]:hidden"}`,
  browserBodyGrid: "mt-3 grid grid-cols-12 gap-3 max-sm:mt-3",
  filterButton: (theme: SiteTheme) =>
    `inline-flex h-9 w-9 items-center justify-center rounded-md border min-[641px]:max-[1100px]:h-11 min-[641px]:max-[1100px]:w-11 min-[641px]:max-[1100px]:[&_svg]:h-5 min-[641px]:max-[1100px]:[&_svg]:w-5 ${shadowClasses.subtle} transition-colors ${siteColorClasses[theme].cookbookFilterButton}`,
  categoryFilterButton: (theme: SiteTheme) =>
    `hidden h-9 w-9 items-center justify-center rounded-md border p-0 min-[641px]:max-[1100px]:h-11 min-[641px]:max-[1100px]:w-11 min-[641px]:max-[1100px]:[&_svg]:h-5 min-[641px]:max-[1100px]:[&_svg]:w-5 ${shadowClasses.subtle} transition-colors max-[1100px]:inline-flex ${siteColorClasses[theme].cookbookFilterButton}`,
  filterChip: (theme: SiteTheme) =>
    `inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
      theme === "dark"
        ? "bg-white/[0.10] text-neutral-200 hover:bg-white/[0.16]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC] text-[#556145] hover:bg-[#C8C0B5]"
          : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
    }`,
  clearFilterChip: (theme: SiteTheme) =>
    `inline-flex items-start rounded-md px-0 py-1 text-[10px] font-bold leading-none transition-colors ${
      theme === "dark"
        ? "text-neutral-400 hover:text-white"
        : theme === "paletteLight"
          ? "text-[#7A8864] hover:text-[#556145]"
          : "text-neutral-500 hover:text-neutral-900"
    }`,
  ingredientPicker: (theme: SiteTheme) =>
    `fixed z-[70] w-72 max-w-[calc(100vw_-_24px)] rounded-md border p-3 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  ingredientPickerSearch: (theme: SiteTheme) =>
    `h-9 w-full rounded-md border px-3 text-sm font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${surfaceClasses.field(theme)}`,
  ingredientPickerEmpty: (theme: SiteTheme) =>
    `rounded-md px-3 py-4 text-sm font-semibold ${
      theme === "dark"
        ? "bg-white/[0.04] text-neutral-400"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45 text-[#7A8864]"
          : "bg-neutral-100 text-neutral-500"
    }`,
  ingredientPickerList:
    "mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1",
  ingredientPickerItem: "h-9 px-3",
  addButton: (theme: SiteTheme) =>
    `inline-flex h-9 w-32 items-center justify-center gap-1 rounded-md border px-3 text-xs font-extrabold ${shadowClasses.subtle} transition-colors max-[1100px]:fixed max-[1100px]:bottom-30 max-[1100px]:right-6 max-[1100px]:z-[55] max-[1100px]:h-11 max-[1100px]:w-11 max-[1100px]:rounded-md max-[1100px]:px-0 max-[1100px]:text-xl max-sm:right-4 max-sm:h-9 max-sm:w-9 max-sm:text-lg ${siteColorClasses[theme].cookbookAddButton}`,
  addButtonLabel: "max-[1100px]:sr-only",
  modalBackdrop: `fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
  modalPanel: (theme: SiteTheme) =>
    `${sizeClasses.modalOuterMaxHeight} w-full max-w-3xl overflow-y-auto rounded-md border p-6 ${responsiveClasses.mobileModalPanel} ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  modalCloseButton: controlStyles.modalCloseButton,
  modalModeSwitch: (theme: SiteTheme) =>
    `flex h-9 w-full overflow-hidden rounded-md border p-1 ${
      theme === "dark"
        ? "border-white/[0.08] bg-black/50"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#7A8864]"
          : "border-neutral-300 bg-neutral-200"
    }`,
  modalModeOption: (theme: SiteTheme, selected: boolean) =>
    `flex h-7 min-w-0 flex-1 items-center justify-center rounded-md px-4 text-xs font-semibold transition-colors ${
      selected
        ? theme === "dark"
          ? "bg-white/[0.14] text-white"
          : theme === "paletteLight"
            ? "bg-[#FAF7F2] text-[#556145]"
            : "bg-neutral-900 text-white"
        : theme === "dark"
          ? "text-neutral-400 hover:text-white"
          : theme === "paletteLight"
            ? "text-[#FAF7F2]/75 hover:text-[#FAF7F2]"
            : "text-neutral-600 hover:text-neutral-900"
    }`,
  modalControlsRow: "mt-4 grid w-full gap-3",
  modalHeader: "flex flex-wrap items-start justify-between gap-3 max-sm:gap-2",
  modalHeaderIntro: "flex items-start justify-between gap-4 max-sm:gap-3",
  modalTitle: "text-2xl font-bold leading-tight max-sm:text-xl",
  modalCloseAligned: (theme: SiteTheme) =>
    `${recipeBrowserStyles.modalCloseButton(theme)} ml-auto`,
  form: "mt-6 grid gap-4",
  formBodyScrollArea: `${sizeClasses.modalFormBodyMaxHeight} ${sizeClasses.modalFormBodyMobileMaxHeight} grid gap-4 overflow-y-auto pr-1`,
  formGrid: "grid grid-cols-2 gap-4 max-md:grid-cols-1",
  fieldHeaderRow:
    "flex items-center justify-between gap-3 max-sm:items-start",
  inlineHelperButton: (theme: SiteTheme) =>
    `inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border px-3 text-[11px] font-bold transition-colors max-sm:h-8 max-sm:px-2 max-sm:text-[10px] ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.06] text-neutral-200 hover:bg-white/[0.12]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/45 text-[#556145] hover:bg-[#C8C0B5]/70"
          : "border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
  recipeCreateScrollArea: (theme: SiteTheme) =>
    `grid gap-4 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.025]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/20"
          : "border-neutral-200 bg-neutral-50"
    }`,
  ingredientCreateScrollArea: (theme: SiteTheme) =>
    `grid gap-4 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.025]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/20"
          : "border-neutral-200 bg-neutral-50"
    }`,
  createFormTopGrid:
    "grid grid-cols-[minmax(0,1fr)_minmax(220px,280px)] gap-4 max-md:grid-cols-1",
  createFormPrimaryFields: "grid min-w-0 content-start gap-4",
  recipeTypeFieldMobile: "md:hidden",
  recipeTypeFieldDesktop: "hidden md:grid",
  createImageField:
    "relative mt-6 grid min-w-0 content-start max-md:mt-0 max-md:gap-2 md:pt-0",
  createImageLabel: "absolute -top-6 left-0 max-md:static",
  createImageControl: "max-md:mt-0",
  ingredientBrandPriceRow:
    "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4 max-sm:grid-cols-1",
  ingredientPriceToggleField: "grid min-w-0 gap-2",
  ingredientPriceToggleButton: (theme: SiteTheme) =>
    `${controlStyles.formField(theme)} flex w-full cursor-pointer items-center justify-center text-center font-semibold transition-colors ${
      theme === "dark"
        ? "hover:bg-white/[0.08]"
        : theme === "paletteLight"
          ? "hover:bg-[#E5D5BC]/55"
          : "hover:bg-neutral-100"
    }`,
  ingredientPricePanel: "grid gap-3 rounded-md border p-3",
  ingredientPriceGrid:
    "grid grid-cols-[minmax(0,1fr)_minmax(0,8rem)] items-start gap-3 max-sm:grid-cols-1",
  ingredientPriceSecondaryGrid:
    "grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-start gap-3 max-sm:grid-cols-1",
  field: "grid min-w-0 gap-2",
  labelStack: "grid gap-0.5",
  label: (theme: SiteTheme) =>
    `text-xs font-bold ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  labelSubtitle: (theme: SiteTheme) =>
    `justify-self-end text-right text-[10px] font-semibold leading-tight ${
      theme === "dark"
        ? "text-neutral-500"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  requiredMark: (theme: SiteTheme) =>
    theme === "dark"
      ? "text-red-300"
      : theme === "paletteLight"
        ? "text-red-700"
        : "text-red-600",
  textField: (theme: SiteTheme) => controlStyles.formField(theme),
  customSelectWrap: "relative min-w-0 w-full",
  customSelectButton: (theme: SiteTheme) =>
    `${controlStyles.formField(theme)} flex w-full items-center justify-between gap-3 text-left`,
  customSelectMenu: (theme: SiteTheme) =>
    `absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 grid max-h-56 gap-1 overflow-y-auto rounded-md border p-2 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  customSelectOption: (theme: SiteTheme, selected: boolean) =>
    `grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold transition-colors ${
      selected
        ? theme === "dark"
          ? "bg-white/[0.12] text-white"
          : theme === "paletteLight"
            ? "bg-[#FAF7F2] text-[#556145]"
            : "bg-neutral-900 text-white"
        : theme === "dark"
          ? "text-neutral-300 hover:bg-white/[0.08] hover:text-white"
          : theme === "paletteLight"
            ? "text-[#556145] hover:bg-[#FAF7F2]"
            : "text-neutral-700 hover:bg-neutral-100"
    }`,
  customSelectDeleteButton: (theme: SiteTheme) =>
    `flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold transition-colors ${
      theme === "dark"
        ? "text-red-200 hover:bg-red-500/20"
        : theme === "paletteLight"
          ? "text-red-900 hover:bg-red-800/12"
          : "text-red-700 hover:bg-red-50"
    }`,
  numberField: "relative",
  numberFieldInput: (theme: SiteTheme) =>
    `${controlStyles.formField(theme)} w-full pr-10`,
  numberFieldSuffix: (theme: SiteTheme) =>
    `pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
      theme === "dark"
        ? "text-neutral-500"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  colorFieldButton: (theme: SiteTheme) =>
    `${controlStyles.formField(theme)} flex w-full cursor-pointer items-center justify-between gap-3 text-left`,
  colorSwatch: "h-5 w-5 shrink-0 rounded-md border border-white/25",
  colorPickerPanel: (theme: SiteTheme) =>
    `grid gap-3 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.04]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/35"
          : "border-neutral-200 bg-neutral-50"
    }`,
  colorPickerInput:
    "h-12 w-full cursor-pointer rounded-md border-0 bg-transparent p-0",
  createOptionPanel: (theme: SiteTheme) =>
    `grid gap-3 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.04]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/35"
          : "border-neutral-200 bg-neutral-50"
    }`,
  textArea: (theme: SiteTheme) =>
    `${controlStyles.textArea(theme)} max-sm:h-9 max-sm:min-h-9 max-sm:resize-none max-sm:px-3 max-sm:py-2 max-sm:text-sm max-sm:leading-tight`,
  helperText: (theme: SiteTheme) =>
    `text-xs font-semibold leading-[1.45] ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  inlineHint: (theme: SiteTheme) =>
    `ml-2 text-[10px] font-semibold ${
      theme === "dark"
        ? "text-neutral-500"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  checkboxGrid:
    "grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-md p-2 max-md:grid-cols-1",
  tagCheckboxGrid:
    "grid grid-cols-3 gap-2 rounded-md p-2 max-md:grid-cols-2 max-sm:grid-cols-1",
  groupedTagPanel: "grid gap-3 rounded-md p-2",
  groupedTagSection: (theme: SiteTheme) =>
    `grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 ${
      theme === "dark"
        ? "border-white/[0.10]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/25"
          : "border-neutral-200"
    }`,
  groupedTagTitle: (theme: SiteTheme) =>
    `text-[11px] font-extrabold uppercase tracking-wide ${
      theme === "dark"
        ? "border-white/[0.10] text-neutral-400"
        : theme === "paletteLight"
          ? "border-[#7A8864]/25 text-[#7A8864]"
          : "border-neutral-200 text-neutral-500"
    }`,
  groupedTagGrid:
    "grid grid-cols-3 gap-2 max-md:grid-cols-2 max-sm:grid-cols-1",
  recipeIngredientPickerGrid: "grid gap-2 overflow-y-auto rounded-md p-2",
  desktopIngredientPicker: "grid gap-2 max-sm:hidden",
  mobileIngredientSummary: "hidden gap-3 max-sm:grid",
  selectedIngredientCapsules:
    "flex flex-wrap gap-2 max-sm:grid max-sm:grid-cols-1",
  selectedIngredientCapsule: (theme: SiteTheme) =>
    `inline-flex h-8 max-w-full items-center rounded-md border px-3 text-xs font-bold text-neutral-950 ${shadowClasses.subtle} ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.72]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]"
          : "border-neutral-300 bg-white"
    }`,
  selectedIngredientSummaryItem: (theme: SiteTheme) =>
    `grid max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border p-1.5 ${shadowClasses.subtle} max-sm:grid-cols-1 ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.04]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/35"
          : "border-neutral-200 bg-neutral-50"
    }`,
  selectedIngredientThumbnail: "min-w-0 max-w-44 max-sm:max-w-full",
  selectedIngredientMeta: (theme: SiteTheme) =>
    `grid min-w-20 gap-0.5 text-right text-[10px] font-bold leading-tight max-sm:grid-cols-2 max-sm:text-left ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  componentRecipeGrid:
    "grid max-h-56 grid-cols-3 gap-2 overflow-y-auto rounded-md p-2 max-md:grid-cols-2 max-sm:grid-cols-2",
  componentRecipeBrowserGrid:
    "grid grid-cols-[repeat(auto-fill,5.5rem)] justify-start gap-2 rounded-md p-2 max-sm:grid-cols-2",
  selectedComponentThumbnails: "flex flex-wrap gap-2",
  selectedComponentThumbnail: "w-20 max-sm:w-16",
  selectedComponentThumbnailCard:
    "[&_h3]:text-xs [&_p]:text-[9px] max-sm:[&_h3]:text-[10px] max-sm:[&_p]:text-[8px]",
  componentRecipeSelected:
    "outline outline-2 outline-offset-[-2px] outline-current",
  conversionHelperIntro: (theme: SiteTheme) =>
    `text-sm font-semibold leading-snug ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-600"
    }`,
  conversionSection: (theme: SiteTheme) =>
    `grid gap-2 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/25"
          : "border-neutral-200 bg-neutral-50"
    }`,
  conversionSectionTitle: (theme: SiteTheme) =>
    `text-sm font-bold ${
      theme === "dark"
        ? "text-neutral-100"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-900"
    }`,
  conversionList: "grid gap-1.5",
  conversionRow: (theme: SiteTheme) =>
    `grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold ${
      theme === "dark"
        ? "bg-white/[0.04] text-neutral-200"
        : theme === "paletteLight"
          ? "bg-[#FAF7F2]/65 text-[#556145]"
          : "bg-white text-neutral-700"
    }`,
  conversionSource: "min-w-0 text-left",
  conversionArrow: (theme: SiteTheme) =>
    theme === "dark"
      ? "text-neutral-500"
      : theme === "paletteLight"
        ? "text-[#7A8864]"
        : "text-neutral-400",
  conversionTarget: "min-w-0 text-right",
  recipeIngredientPickerRow:
    "grid grid-cols-[auto_minmax(0,1fr)_6rem_8rem_10rem] items-center gap-2 max-[1100px]:grid-cols-[auto_minmax(0,1fr)_6rem] max-md:grid-cols-[auto_minmax(0,1fr)] max-sm:gap-y-2",
  recipeIngredientControlGrid:
    "contents max-sm:col-span-2 max-sm:grid max-sm:grid-cols-2 max-sm:gap-2",
  recipeIngredientPreparationField: "max-sm:col-span-2",
  compactTextField: (theme: SiteTheme) => controlStyles.compactTextField(theme),
  checkboxGridPanel: (theme: SiteTheme) =>
    theme === "dark"
      ? "bg-white/[0.04]"
      : theme === "paletteLight"
        ? "bg-[#E5D5BC]/45"
        : "bg-neutral-100",
  detailsToggle: (theme: SiteTheme) =>
    `inline-flex h-9 w-fit cursor-pointer items-center justify-center rounded-md border px-4 text-xs font-bold transition-colors ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.06] text-neutral-200 hover:bg-white/[0.12]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/45 text-[#556145] hover:bg-[#C8C0B5]/70"
          : "border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
  detailsToggleFull: (theme: SiteTheme) =>
    `inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-md border px-6 text-base font-semibold transition-colors ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.06] text-neutral-200 hover:bg-white/[0.12]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/45 text-[#556145] hover:bg-[#C8C0B5]/70"
          : "border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
  imageUploadActionStack:
    "absolute left-1/2 top-1/2 z-10 grid w-fit -translate-x-1/2 -translate-y-1/2 gap-2 max-[1100px]:static max-[1100px]:translate-x-0 max-[1100px]:translate-y-0 max-sm:absolute max-sm:left-1/2 max-sm:top-1/2 max-sm:w-[min(10rem,calc(100%-1rem))] max-sm:-translate-x-1/2 max-sm:-translate-y-1/2",
  imageUploadFloatingButton: (theme: SiteTheme) =>
    `inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-center text-[10px] font-bold leading-none ${shadowClasses.subtle} transition-colors max-sm:w-full max-sm:px-2 max-sm:text-xs ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-950/85 text-neutral-200 hover:bg-neutral-950"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/90 text-[#556145] hover:bg-[#FAF7F2]"
          : "border-neutral-300 bg-white/90 text-neutral-800 hover:bg-white"
    }`,
  imageCaptureButton: (theme: SiteTheme) =>
    `hidden h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-2 text-center text-xs font-bold leading-none ${shadowClasses.subtle} transition-colors ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-950/85 text-neutral-200 hover:bg-neutral-950"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/90 text-[#556145] hover:bg-[#FAF7F2]"
          : "border-neutral-300 bg-white/90 text-neutral-800 hover:bg-white"
    }`,
  imageUploadIcon: "h-4 w-4",
  desktopUploadLabel: "max-sm:hidden",
  mobileUploadLabel: "hidden max-sm:inline",
  compactIngredientImageControl:
    "relative grid max-md:min-h-0 max-md:grid-cols-[5.5rem_minmax(0,8fr)] max-md:items-center max-md:gap-3",
  compactIngredientImagePreview: (theme: SiteTheme) =>
    `flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border ${shadowClasses.subtle} max-md:h-[5.5rem] max-md:min-h-0 max-md:w-[5.5rem] ${
      theme === "dark"
        ? "border-white/[0.14] bg-white/[0.08]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]"
          : "border-neutral-300 bg-neutral-100"
    }`,
  compactIngredientImage: "",
  compactIngredientImageFallback:
    "text-xl font-black leading-none opacity-55 max-md:text-xs",
  compactIngredientImageButton: (theme: SiteTheme) =>
    `${recipeBrowserStyles.imageUploadFloatingButton(theme)} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-md:static max-md:translate-x-0 max-md:translate-y-0`,
  detailsPanel: (theme: SiteTheme) =>
    `grid content-start gap-4 rounded-md border p-3 ${surfaceClasses.panel(theme)}`,
  formActions:
    "flex flex-wrap items-center justify-end gap-3 pt-2 max-sm:flex-nowrap",
  formActionButton:
    "max-sm:h-10 max-sm:min-w-0 max-sm:flex-1 max-sm:px-3 max-sm:text-sm",
  nestedModalBackdrop: `fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
  nestedIngredientModalPanel: (theme: SiteTheme) =>
    `grid ${sizeClasses.modalOuterMaxHeight} w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-md border p-6 max-sm:max-h-[calc(100vh_-_16px)] max-sm:p-4 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  nestedIngredientModalBody: `${sizeClasses.modalFormBodyMaxHeight} ${sizeClasses.modalFormBodyMobileMaxHeight} grid min-h-0 gap-3 overflow-y-auto pr-1`,
  primaryButton: controlStyles.primaryButton,
  detailHeaderEditButton: (theme: SiteTheme) =>
    `inline-flex h-9 min-w-20 items-center justify-center rounded-md border px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 max-sm:h-10 max-sm:min-w-0 max-sm:flex-1 max-sm:text-sm ${
      theme === "dark"
        ? "border-white/[0.12] bg-white/[0.14] text-white hover:bg-white/[0.2]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#7A8864] text-[#FAF7F2] hover:bg-[#6A7658]"
          : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700"
    }`,
  detailHeaderRemoveButton: (theme: SiteTheme) =>
    `inline-flex h-9 min-w-20 items-center justify-center rounded-md border px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 max-sm:h-10 max-sm:min-w-0 max-sm:flex-1 max-sm:text-sm ${
      theme === "dark"
        ? "border-red-950 bg-red-950 text-white hover:bg-red-900"
        : theme === "paletteLight"
          ? "border-red-950 bg-red-950 text-[#FAF7F2] hover:bg-red-900"
          : "border-red-900 bg-red-900 text-white hover:bg-red-800"
    }`,
  detailModalPanel: (theme: SiteTheme) =>
    `relative grid ${sizeClasses.modalOuterMaxHeight} w-full max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-md border p-6 ${responsiveClasses.mobileModalPanel} ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  detailCloseButton: (theme: SiteTheme) =>
    `${recipeBrowserStyles.modalCloseButton(theme)} ml-auto`,
  detailBodyScrollArea: `${sizeClasses.modalFormBodyMaxHeight} ${sizeClasses.modalFormBodyMobileMaxHeight} grid min-h-0 gap-4 overflow-y-auto pr-1`,
  detailFrameHeader: "flex items-start justify-between gap-4",
  detailHeaderDescription: "mt-2",
  detailHeaderShell: "grid gap-2 max-sm:pr-12",
  detailHeaderTitleRow: "flex flex-wrap items-center gap-2",
  detailHeaderActionRow:
    "flex flex-wrap items-center justify-end gap-2 pt-2 max-sm:border-t max-sm:pt-4",
  detailHeaderTagList: "flex min-w-0 flex-wrap items-center gap-2",
  detailHeaderTitle: "min-w-0 text-2xl font-bold leading-tight",
  detailHeaderBackButton: (theme: SiteTheme) =>
    `inline-flex h-9 min-w-20 items-center justify-center rounded-md border px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 max-sm:h-10 max-sm:min-w-0 max-sm:flex-1 max-sm:text-sm ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.06] text-neutral-200 hover:bg-white/[0.12]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/45 text-[#556145] hover:bg-[#C8C0B5]/70"
          : "border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
  secondaryButton: controlStyles.secondaryButton,
  statusError: (theme: SiteTheme) =>
    `rounded-md border px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : theme === "paletteLight"
          ? "border-red-700/25 bg-red-700/10 text-red-800"
          : "border-red-200 bg-red-50 text-red-700"
    }`,
  statusErrorWithOffset: (theme: SiteTheme) =>
    `mt-4 ${recipeBrowserStyles.statusError(theme)}`,
  cropPreview: (theme: SiteTheme) =>
    `relative aspect-square w-full overflow-hidden rounded-md border max-[1100px]:h-[5.5rem] max-[1100px]:w-[5.5rem] max-sm:h-auto max-sm:w-full ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]"
          : "border-neutral-300 bg-neutral-100"
    }`,
  tabs: (theme: SiteTheme) =>
    `${segmentedToggleStyles.shell(theme)} max-[1100px]:!rounded-none ${
      theme === "dark"
        ? "max-[1100px]:!border-neutral-800 max-[1100px]:!bg-neutral-950"
        : theme === "paletteLight"
          ? "!border-[#556145] !bg-[#556145]"
          : "max-[1100px]:!border-neutral-300 max-[1100px]:!bg-neutral-200"
    }`,
  tab: (theme: SiteTheme, selected: boolean) =>
    segmentedToggleStyles.option(theme, selected),
  filterRail: (theme: SiteTheme) =>
    `col-span-2 rounded-md p-3 ${shadowClasses.subtle} max-[1100px]:hidden ${
      theme === "dark"
        ? "bg-white/[0.04]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45"
          : "bg-neutral-100"
    }`,
  filterPanel: (theme: SiteTheme) =>
    `grid max-h-[48vh] gap-0 overflow-y-auto rounded-md p-3 max-sm:max-h-[40vh] ${
      theme === "dark"
        ? "bg-white/[0.04]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45"
          : "bg-neutral-100"
    }`,
  filterGroup: (theme: SiteTheme) =>
    `border-b pb-3 pt-3 first:pt-0 last:border-b-0 last:pb-0 ${
      theme === "dark"
        ? "border-white/[0.16]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/25"
          : "border-neutral-300"
    }`,
  filterLegend: (theme: SiteTheme) =>
    `text-sm font-bold ${theme === "dark" ? "text-neutral-100" : theme === "paletteLight" ? "text-[#556145]" : "text-neutral-900"}`,
  filterGroupHeader: "flex items-center justify-between gap-2",
  filterOptionList: "mt-2 flex flex-col gap-1",
  groupedFilterOptionList: "mt-2 grid gap-3",
  groupedFilterSection: (theme: SiteTheme) =>
    `grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 ${
      theme === "dark"
        ? "border-white/[0.10]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/25"
          : "border-neutral-200"
    }`,
  checkboxLabel: (theme: SiteTheme) =>
    `flex items-center gap-2 text-xs font-semibold ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  disabledFilterOption: (theme: SiteTheme) =>
    `cursor-not-allowed opacity-40 ${
      theme === "dark"
        ? "text-neutral-500"
        : theme === "paletteLight"
          ? "text-[#7A8864]/65"
          : "text-neutral-400"
    }`,
  checkbox: "h-4 w-4 rounded border-neutral-400 accent-neutral-500",
  addTagButton: (theme: SiteTheme) =>
    `flex items-center justify-start gap-2 rounded-md border-0 bg-transparent p-0 text-left text-xs font-semibold transition-colors before:flex before:h-4 before:w-4 before:items-center before:justify-center before:rounded before:text-[10px] before:font-bold before:content-['+'] disabled:cursor-not-allowed disabled:opacity-45 ${
      theme === "dark"
        ? "text-neutral-300 hover:text-neutral-100 before:bg-white/[0.10] before:text-neutral-200"
        : theme === "paletteLight"
          ? "text-[#556145] hover:text-[#7A8864] before:bg-[#7A8864] before:text-[#FAF7F2]"
          : "text-emerald-800 hover:text-emerald-950 before:bg-emerald-100 before:text-emerald-900"
    }`,
  tagCategorySelectRow:
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 max-sm:grid-cols-1",
  manageTagsList: "grid gap-3",
  manageTagCategory: (theme: SiteTheme, selected = false) =>
    `grid cursor-pointer gap-3 rounded-md border p-3 transition-colors ${
      theme === "dark"
        ? selected
          ? "border-white/[0.24] bg-white/[0.08]"
          : "border-white/[0.10] bg-white/[0.04]"
        : theme === "paletteLight"
          ? selected
            ? "border-[#7A8864]/65 bg-[#E5D5BC]/55"
            : "border-[#C8C0B5] bg-[#E5D5BC]/35"
          : selected
            ? "border-neutral-400 bg-neutral-100"
            : "border-neutral-200 bg-neutral-50"
    }`,
  manageTagDivider: (theme: SiteTheme, emphasis: "category" | "item" = "item") =>
    theme === "dark"
      ? emphasis === "category"
        ? "border-white/[0.16]"
        : "border-white/[0.08]"
      : theme === "paletteLight"
        ? emphasis === "category"
          ? "border-[#7A8864]/35"
          : "border-[#7A8864]/18"
        : emphasis === "category"
          ? "border-neutral-300"
          : "border-neutral-200",
  manageTagCategoryRow:
    "grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center gap-2 border-b pb-3 max-sm:grid-cols-2 [&>input]:max-sm:col-span-2 [&>button]:max-sm:w-full",
  manageTagList: "grid",
  manageTagRow:
    "grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center gap-2 border-b py-2 pl-8 last:border-b-0 last:pb-0 max-sm:grid-cols-2 max-sm:pl-4 [&>input]:max-sm:col-span-2 [&>button]:max-sm:w-full",
  manageTagActionButton: (theme: SiteTheme) =>
    `${controlStyles.secondaryButton(theme)} w-28 min-w-0 px-4 max-sm:h-9 max-sm:w-full max-sm:px-3 max-sm:text-sm`,
  manageTagRemoveButton: (theme: SiteTheme) =>
    `${controlStyles.removeButton(theme)} w-28 min-w-0 px-4 max-sm:h-9 max-sm:w-full max-sm:px-3 max-sm:text-sm`,
  resultsWithFilters: "col-span-10 max-[1100px]:col-span-12",
  recipeGrid: `grid grid-cols-3 gap-3 min-[641px]:max-[1100px]:grid-cols-4 ${sizeClasses.portableBottomNavOffset} max-md:grid-cols-2 max-[380px]:grid-cols-1`,
  ingredientGridPanel: (_theme: SiteTheme) => "",
  ingredientGrid: `grid grid-cols-3 items-start gap-3 max-[1100px]:grid-cols-2 ${sizeClasses.portableBottomNavOffset} max-sm:grid-cols-1`,
  emptyFilterChipSlot: "h-9",
  recipeCard: (theme: SiteTheme) =>
    `${shadowClasses.subtle} ${
      theme === "dark"
        ? "ring-1 ring-white/[0.08]"
        : theme === "paletteLight"
          ? "ring-1 ring-[#7A8864]/20"
          : "ring-1 ring-neutral-200"
    }`,
  emptyState: (theme: SiteTheme) =>
    `flex min-h-80 flex-col items-center justify-center rounded-md border p-8 text-center max-sm:min-h-56 max-sm:p-5 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035] text-neutral-200"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/70 text-[#556145]"
          : "border-neutral-200 bg-neutral-50 text-neutral-700"
    }`,
  emptyStateTitle: "text-2xl font-bold leading-[1.15] max-sm:text-xl",
  emptyStateBody: "mt-2 max-w-xl text-base leading-[1.5] max-sm:text-sm",
  detailShell: "mt-6 grid gap-6 max-sm:mt-4 max-sm:gap-4",
  recipeDetailHeroGrid:
    "grid grid-cols-[minmax(180px,260px)_minmax(0,1fr)] gap-6 max-md:grid-cols-1 max-sm:grid-cols-2 max-sm:items-start max-sm:gap-3",
  recipeDetailImageFrame:
    "aspect-square overflow-hidden rounded-md bg-neutral-800",
  detailImage: "h-full w-full object-cover",
  detailImageFallback:
    "flex h-full w-full items-center justify-center px-4 text-center text-sm font-bold text-neutral-400",
  recipeDetailDescriptionWrap: "grid content-start",
  recipeDetailDescriptionPanel:
    "h-[260px] grid-rows-[auto_minmax(0,1fr)] max-md:h-auto max-sm:min-h-[38vw]",
  recipeDetailSplitGrid: "grid grid-cols-2 gap-6 max-md:grid-cols-1",
  detailSectionHeader: "flex flex-wrap items-center justify-between gap-3",
  detailSectionTitleRow: "flex flex-wrap items-baseline gap-2",
  detailSectionTitle: "text-sm font-bold uppercase tracking-wide",
  detailSectionSubtitle: (theme: SiteTheme) =>
    `text-xs font-semibold normal-case tracking-normal ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  detailText:
    "self-start whitespace-pre-wrap text-left text-sm font-semibold leading-[1.55]",
  detailTextScrollable:
    "min-h-0 self-start overflow-y-auto whitespace-pre-wrap pr-1 text-left text-sm font-semibold leading-[1.55]",
  detailTextMetaHeader: "flex flex-wrap items-baseline justify-between gap-3",
  detailRow: (theme: SiteTheme) =>
    `flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "bg-white/[0.05] text-neutral-200"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45 text-[#556145]"
          : "bg-neutral-100 text-neutral-700"
    }`,
  detailRows: "grid gap-2",
  detailIngredientSections: "grid gap-4",
  detailIngredientSection: "grid gap-2",
  detailIngredientSectionTitle: (theme: SiteTheme) =>
    `text-[11px] font-extrabold uppercase tracking-wide ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  detailIngredientSectionTitleButton: (theme: SiteTheme) =>
    `cursor-pointer border-0 bg-transparent p-0 text-[11px] font-extrabold uppercase tracking-wide underline-offset-2 hover:underline ${siteColorClasses[theme].plannerCounterAccent}`,
  detailComponentGroups: "grid gap-3",
  detailComponentGroup: (theme: SiteTheme) =>
    `grid gap-2 border-b pb-3 last:border-b-0 last:pb-0 ${
      theme === "dark"
        ? "border-white/[0.08]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5]"
          : "border-neutral-200"
    }`,
  detailComponentGrid: "grid grid-cols-3 gap-2 max-sm:grid-cols-2",
  detailComponentThumbnail: "min-w-0",
  detailRowLabel: "font-bold",
  detailRowValue: "shrink-0",
  detailIngredientRow: (theme: SiteTheme) =>
    `grid min-h-14 w-full grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2 rounded-md p-1.5 text-left text-sm font-semibold transition-colors ${
      theme === "dark"
        ? "bg-white/[0.05] text-neutral-200 hover:bg-white/[0.09]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45 text-[#556145] hover:bg-[#E5D5BC]/70"
          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
    }`,
  detailIngredientImageFrame: (theme: SiteTheme) =>
    `flex aspect-square h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.08]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]"
          : "border-neutral-200 bg-white"
    }`,
  detailIngredientImage: "h-full w-full object-cover",
  detailIngredientImageFallback:
    "text-xs font-black leading-none text-white/90",
  detailIngredientContent: "grid min-w-0 gap-1",
  detailIngredientName:
    "min-w-0 truncate text-sm font-bold leading-tight",
  detailIngredientMetaRow:
    "grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2",
  detailIngredientAmount:
    "min-w-0 truncate text-left text-xs font-semibold opacity-80",
  detailIngredientPreparation:
    "min-w-0 truncate text-right text-xs font-bold",
  ingredientDetailOverviewGrid: "grid grid-cols-2 gap-3",
  ingredientDetailImageFrame: (theme: SiteTheme) =>
    `flex aspect-square min-h-0 w-full items-center justify-center overflow-hidden rounded-md border ${shadowClasses.subtle} ${
      theme === "dark"
        ? "border-white/[0.14] bg-white/[0.08]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]"
          : "border-neutral-300 bg-neutral-100"
    }`,
  ingredientDetailImage: "h-full w-full object-cover",
  ingredientDetailImageFallback: "text-2xl font-black leading-none opacity-70",
  ingredientDetailMetaStack: "grid content-start gap-3",
  ingredientDetailMetaField: (theme: SiteTheme) =>
    `grid gap-1 rounded-md px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "bg-white/[0.05] text-neutral-200"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45 text-[#556145]"
          : "bg-neutral-100 text-neutral-700"
    }`,
  ingredientDetailMetaLabel: (theme: SiteTheme) =>
    `text-[10px] font-extrabold uppercase tracking-wide ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  ingredientDetailMetaValue: "min-w-0 truncate",
  ingredientDetailActionButton: (theme: SiteTheme) =>
    `${controlStyles.primaryButton(theme)} h-10 min-w-0 px-3 text-xs max-sm:h-10 max-sm:w-full`,
  ingredientPriceDialogForm: "grid gap-3",
  ingredientPriceForm:
    "grid grid-cols-[minmax(0,1fr)_8rem_auto] items-end gap-3 max-sm:grid-cols-1",
  ingredientPriceField: "grid gap-2",
  ingredientPriceInput: (theme: SiteTheme) => controlStyles.formField(theme),
  ingredientPriceButton: (theme: SiteTheme) =>
    `${controlStyles.primaryButton(theme)} max-sm:w-full`,
  ingredientPriceRows: "grid gap-2",
  ingredientPriceRow: (theme: SiteTheme) =>
    `grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold max-sm:grid-cols-1 max-sm:gap-1 ${
      theme === "dark"
        ? "bg-white/[0.05] text-neutral-200"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45 text-[#556145]"
          : "bg-neutral-100 text-neutral-700"
    }`,
  ingredientPriceRowMain: "grid min-w-0 gap-1",
  ingredientPriceStore: "min-w-0 truncate font-bold",
  ingredientPriceNote: (theme: SiteTheme) =>
    `min-w-0 truncate text-xs font-semibold ${
      theme === "dark"
        ? "text-neutral-400"
        : theme === "paletteLight"
          ? "text-[#7A8864]"
          : "text-neutral-500"
    }`,
  ingredientPriceValue:
    "justify-self-end text-base font-extrabold max-sm:justify-self-start",
  ingredientPriceDate:
    "justify-self-end text-xs font-bold opacity-70 max-sm:justify-self-start",
  detailChipSection: "grid gap-2",
  detailChipSectionCompact: "grid gap-1",
  detailChipList: "flex flex-wrap gap-2",
  nutritionGrid: "grid gap-3",
  nutritionGridGroupWrap: "grid gap-2",
  nutritionGridGroupTitle: (theme: SiteTheme) =>
    `text-xs font-extrabold uppercase tracking-wide ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-600"
    }`,
  nutritionGridGroup: "grid grid-cols-2 gap-2 max-sm:grid-cols-1",
  scaleLabel: "flex items-center gap-2",
  scaleField: "w-20",
  scaleInput: "w-full pr-6",
  imageCropper:
    "relative grid gap-3 max-[1100px]:grid-cols-[5.5rem_minmax(0,8fr)] max-[1100px]:items-center max-sm:grid-cols-1 max-sm:items-start",
  hiddenFileInput: "sr-only",
  cropImage: "h-full w-full object-cover",
  cropFallback:
    "flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold opacity-60",
  cropControls: "grid gap-3 max-sm:gap-2",
  cropConfirmButton: "max-sm:h-8 max-sm:min-w-0 max-sm:px-3 max-sm:text-xs",
  sliderField: "grid gap-1 text-xs font-bold",
  createOptionActions: "flex items-center justify-end gap-3",
  customSelectOptionLabel: "min-w-0 truncate",
  colorPickerActions: "flex items-center justify-end gap-3",
  filterIcon: "h-6 w-6",
  categoryFilterBackdrop: `fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 ${responsiveClasses.mobileModalBackdrop}`,
  categoryFilterPanel: (theme: SiteTheme) =>
    `grid max-h-[64vh] w-full max-w-md grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-md border p-6 max-sm:max-h-[56vh] max-sm:p-4 ${shadowClasses.overlay} ${surfaceClasses.modal(theme)}`,
  categoryFilterHeader: "flex items-center justify-between gap-3",
  categoryFilterBody: "min-h-0 overflow-y-auto",
  recipeIngredientThumbnailCompact: "",
  nutritionEditorGroup: (theme: SiteTheme) =>
    `grid gap-2 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/55"
          : "border-neutral-200 bg-white"
    }`,
  nutritionEditorGroupButton: (theme: SiteTheme) =>
    `flex w-full items-center justify-between gap-3 text-left text-sm font-semibold leading-tight transition-opacity hover:opacity-80 ${
      theme === "dark"
        ? "text-neutral-300"
        : theme === "paletteLight"
          ? "text-[#556145]"
          : "text-neutral-700"
    }`,
  nutritionEditorGroupIcon: (isOpen: boolean) =>
    `flex h-5 w-5 shrink-0 items-center justify-center transition-transform ${
      isOpen ? "rotate-90" : ""
    }`,
  nutritionEditorGroupSvg: "h-3.5 w-3.5 fill-current",
  nutritionEditorSection: "grid grid-cols-2 gap-4 max-md:grid-cols-1",
  nutritionSeparator: (theme: SiteTheme) =>
    `h-px w-full ${
      theme === "dark"
        ? "bg-white/[0.10]"
        : theme === "paletteLight"
          ? "bg-[#C8C0B5]"
          : "bg-neutral-200"
    }`,
};

export function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
