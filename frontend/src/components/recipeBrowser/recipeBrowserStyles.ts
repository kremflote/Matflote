import { siteColorClasses, type SiteTheme } from "../../styles/appStyles";

export const recipeBrowserStyles = {
  title: (theme: SiteTheme) =>
    `whitespace-nowrap text-[40px] font-bold leading-[1.15] ${theme === "paletteLight" ? "text-[#556145]" : siteColorClasses[theme].plannerCounterAccent}`,
  headerTitle: "col-span-2 max-lg:col-span-12",
  searchInput: (theme: SiteTheme) =>
    `h-9 w-full rounded-md border px-3 text-sm font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-200 text-neutral-900 focus-visible:outline-white"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145] focus-visible:outline-[#7A8864]"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800"
    }`,
  headerControlsRow: "mt-3 grid grid-cols-12 items-center gap-3",
  searchControls: "relative col-span-2 max-lg:col-span-12 max-lg:flex max-lg:items-center max-lg:gap-3",
  headerActions: "col-span-10 flex items-center justify-end gap-3 max-lg:col-span-12 max-lg:justify-start",
  filterButtonSlot: "absolute left-[calc(100%+0.75rem)] top-0 h-9 w-9 shrink-0 max-lg:static",
  searchFilterRow: "mt-3 grid grid-cols-12 items-start gap-3",
  activeFilterChips: (mode: "recipes" | "ingredients") =>
    `col-span-10 flex min-h-9 flex-wrap items-start gap-2 max-lg:col-span-12 ${
      mode === "recipes" ? "pl-12 max-lg:pl-0" : ""
    }`,
  browserBodyGrid: "mt-3 grid grid-cols-12 gap-3",
  filterButton: (theme: SiteTheme) =>
    `inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-500 text-neutral-950 hover:bg-neutral-400"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#C8C0B5] text-[#556145] hover:bg-[#A9BDD1]/40"
          : "border-neutral-300 bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
    }`,
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
    `fixed z-50 w-72 rounded-md border p-3 shadow-xl ${
      theme === "dark"
        ? "border-white/[0.12] bg-neutral-950 text-neutral-100"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145]"
          : "border-neutral-200 bg-white text-neutral-900"
    }`,
  ingredientPickerSearch: (theme: SiteTheme) =>
    `h-9 w-full rounded-md border px-3 text-sm font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-200 text-neutral-900 focus-visible:outline-white"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white text-[#556145] focus-visible:outline-[#7A8864]"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800"
    }`,
  ingredientPickerEmpty: (theme: SiteTheme) =>
    `rounded-md px-3 py-4 text-sm font-semibold ${
      theme === "dark"
        ? "bg-white/[0.04] text-neutral-400"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45 text-[#7A8864]"
          : "bg-neutral-100 text-neutral-500"
    }`,
  ingredientPickerList: "mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1",
  ingredientPickerItem: "h-9 px-3",
  addButton: (theme: SiteTheme) =>
    `inline-flex h-9 w-32 items-center justify-center rounded-md border px-3 text-xs font-extrabold transition-colors ${
      theme === "dark"
        ? "border-white/[0.08] bg-black/50 text-white hover:bg-white/[0.08]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#FAF7F2] text-[#556145] hover:bg-[#F4EBCF]"
          : "border-neutral-300 bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
    }`,
  modalBackdrop: "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4",
  modalPanel: (theme: SiteTheme) =>
    `max-h-[calc(100vh_-_48px)] w-full max-w-3xl overflow-y-auto rounded-md border p-5 shadow-xl ${
      theme === "dark"
        ? "border-white/[0.12] bg-neutral-950 text-neutral-100"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145]"
          : "border-neutral-200 bg-white text-neutral-900"
    }`,
  modalCloseButton: (theme: SiteTheme) =>
    `rounded-md px-3 py-2 text-sm font-bold transition-colors ${
      theme === "dark"
        ? "bg-white/[0.08] text-neutral-200 hover:bg-white/[0.14]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC] text-[#556145] hover:bg-[#C8C0B5]"
          : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
  modalModeSwitch: (theme: SiteTheme) =>
    `inline-flex h-9 overflow-hidden rounded-md border p-1 ${
      theme === "dark"
        ? "border-white/[0.08] bg-black/50"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#7A8864]"
          : "border-neutral-300 bg-neutral-200"
    }`,
  modalModeOption: (theme: SiteTheme, selected: boolean) =>
    `flex h-7 min-w-28 items-center justify-center rounded-md px-4 text-xs font-semibold transition-colors ${
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
  modalControlsRow: "mt-4 flex flex-wrap items-center gap-3",
  modalHeader: "flex flex-wrap items-center justify-between gap-3",
  modalHeaderIntro: "flex items-start justify-between gap-4",
  modalTitle: "text-2xl font-bold leading-tight",
  modalIntroText: "mt-2 text-sm font-semibold leading-[1.5] opacity-75",
  modalCloseAligned: (theme: SiteTheme) => `${recipeBrowserStyles.modalCloseButton(theme)} ml-auto`,
  form: "mt-5 grid gap-4",
  formGrid: "grid grid-cols-2 gap-4 max-md:grid-cols-1",
  recipeCreateScrollArea: (theme: SiteTheme) =>
    `grid max-h-[62vh] gap-4 overflow-y-auto rounded-md border p-3 pr-4 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.025]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/20"
          : "border-neutral-200 bg-neutral-50"
    }`,
  ingredientCreateScrollArea: (theme: SiteTheme) =>
    `grid max-h-[62vh] gap-4 overflow-y-auto rounded-md border p-3 pr-4 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.025]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/20"
          : "border-neutral-200 bg-neutral-50"
    }`,
  recipeCreateTopGrid: "grid grid-cols-[minmax(0,1fr)_minmax(220px,280px)] gap-4 max-md:grid-cols-1",
  recipePrimaryFields: "grid content-start gap-4",
  recipeImageField: "relative grid content-start",
  field: "grid gap-2",
  label: (theme: SiteTheme) =>
    `text-xs font-bold ${
      theme === "dark" ? "text-neutral-300" : theme === "paletteLight" ? "text-[#556145]" : "text-neutral-700"
    }`,
  requiredMark: (theme: SiteTheme) =>
    theme === "dark" ? "text-red-300" : theme === "paletteLight" ? "text-red-700" : "text-red-600",
  textField: (theme: SiteTheme) =>
    `h-10 rounded-md border px-3 text-sm font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900 text-neutral-100 focus-visible:outline-white"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white text-[#556145] focus-visible:outline-[#7A8864]"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800"
    }`,
  customSelectWrap: "relative",
  customSelectButton: (theme: SiteTheme) =>
    `flex h-10 w-full items-center justify-between gap-3 rounded-md border px-3 text-left text-sm font-semibold outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900 text-neutral-100 focus-visible:outline-white"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white text-[#556145] focus-visible:outline-[#7A8864]"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800"
    }`,
  customSelectMenu: (theme: SiteTheme) =>
    `absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 grid max-h-56 gap-1 overflow-y-auto rounded-md border p-2 shadow-xl ${
      theme === "dark"
        ? "border-white/[0.12] bg-neutral-950 text-neutral-100"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2] text-[#556145]"
          : "border-neutral-200 bg-white text-neutral-900"
    }`,
  customSelectOption: (theme: SiteTheme, selected: boolean) =>
    `grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold transition-colors ${
      selected
        ? theme === "dark"
          ? "bg-white/[0.12] text-white"
          : theme === "paletteLight"
            ? "bg-[#F4EBCF] text-[#556145]"
            : "bg-neutral-900 text-white"
        : theme === "dark"
          ? "text-neutral-300 hover:bg-white/[0.08] hover:text-white"
          : theme === "paletteLight"
            ? "text-[#556145] hover:bg-[#F4EBCF]"
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
    `h-10 w-full rounded-md border px-3 pr-10 text-sm font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900 text-neutral-100 focus-visible:outline-white"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white text-[#556145] focus-visible:outline-[#7A8864]"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800"
    }`,
  numberFieldSuffix: (theme: SiteTheme) =>
    `pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${
      theme === "dark" ? "text-neutral-500" : theme === "paletteLight" ? "text-[#7A8864]" : "text-neutral-500"
    }`,
  colorFieldButton: (theme: SiteTheme) =>
    `flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-left text-sm font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900 text-neutral-100 focus-visible:outline-white"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white text-[#556145] focus-visible:outline-[#7A8864]"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800"
    }`,
  colorSwatch: "h-5 w-5 shrink-0 rounded-md border border-white/25",
  colorPickerPanel: (theme: SiteTheme) =>
    `grid gap-3 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.04]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/35"
          : "border-neutral-200 bg-neutral-50"
    }`,
  colorPickerInput: "h-10 w-full cursor-pointer rounded-md border-0 bg-transparent p-0",
  createOptionPanel: (theme: SiteTheme) =>
    `grid gap-3 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.04]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/35"
          : "border-neutral-200 bg-neutral-50"
    }`,
  textArea: (theme: SiteTheme) =>
    `min-h-28 resize-y rounded-md border px-3 py-2 text-sm font-semibold leading-[1.5] outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900 text-neutral-100 focus-visible:outline-white"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white text-[#556145] focus-visible:outline-[#7A8864]"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800"
    }`,
  helperText: (theme: SiteTheme) =>
    `text-xs font-semibold leading-[1.45] ${
      theme === "dark" ? "text-neutral-400" : theme === "paletteLight" ? "text-[#7A8864]" : "text-neutral-500"
    }`,
  inlineHint: (theme: SiteTheme) =>
    `ml-2 text-[10px] font-semibold ${
      theme === "dark" ? "text-neutral-500" : theme === "paletteLight" ? "text-[#7A8864]" : "text-neutral-500"
    }`,
  checkboxGrid: "grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-md p-2 max-md:grid-cols-1",
  tagCheckboxGrid: "grid grid-cols-3 gap-2 rounded-md p-2 max-md:grid-cols-2 max-sm:grid-cols-1",
  recipeIngredientPickerGrid: "grid max-h-56 gap-2 overflow-y-auto rounded-md p-2",
  recipeIngredientPickerRow: "grid grid-cols-[auto_minmax(0,1fr)_6rem_9rem] items-center gap-2 max-md:grid-cols-[auto_minmax(0,1fr)]",
  compactTextField: (theme: SiteTheme) =>
    `h-8 min-w-0 rounded-md border px-2 text-xs font-semibold outline-none placeholder:text-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900 text-neutral-100 focus-visible:outline-white disabled:opacity-45"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white text-[#556145] focus-visible:outline-[#7A8864] disabled:opacity-45"
          : "border-neutral-300 bg-white text-neutral-900 focus-visible:outline-neutral-800 disabled:opacity-45"
    }`,
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
    `inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-md border px-4 text-sm font-bold transition-colors ${
      theme === "dark"
        ? "border-white/[0.10] bg-white/[0.06] text-neutral-200 hover:bg-white/[0.12]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/45 text-[#556145] hover:bg-[#C8C0B5]/70"
          : "border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
    }`,
  imageUploadFloatingButton: (theme: SiteTheme) =>
    `absolute left-1/2 top-1/2 z-10 inline-flex h-9 w-fit -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-center text-[10px] font-bold leading-none shadow-sm transition-colors ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-950/85 text-neutral-200 hover:bg-neutral-950"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/90 text-[#556145] hover:bg-[#FAF7F2]"
          : "border-neutral-300 bg-white/90 text-neutral-800 hover:bg-white"
    }`,
  imageUploadIcon: "h-4 w-4",
  detailsPanel: (theme: SiteTheme) =>
    `grid gap-4 rounded-md border p-3 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#E5D5BC]/30"
          : "border-neutral-200 bg-neutral-50"
    }`,
  formActions: "flex flex-wrap items-center justify-end gap-3 pt-2",
  primaryButton: (theme: SiteTheme) =>
    `inline-flex h-10 min-w-32 items-center justify-center rounded-md border px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
      theme === "dark"
        ? "border-white/[0.12] bg-white/[0.14] text-white hover:bg-white/[0.2]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#7A8864] text-[#FAF7F2] hover:bg-[#6A7658]"
          : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700"
    }`,
  detailHeaderEditButton: (theme: SiteTheme) =>
    `inline-flex h-9 min-w-28 items-center justify-center rounded-md border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
      theme === "dark"
        ? "border-white/[0.12] bg-white/[0.14] text-white hover:bg-white/[0.2]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#7A8864] text-[#FAF7F2] hover:bg-[#6A7658]"
          : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700"
    }`,
  detailHeaderRemoveButton: (theme: SiteTheme) =>
    `inline-flex h-9 min-w-24 items-center justify-center rounded-md border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
      theme === "dark"
        ? "border-red-400/25 bg-red-500/12 text-red-200 hover:bg-red-500/20"
        : theme === "paletteLight"
          ? "border-red-800/25 bg-red-800/12 text-red-900 hover:bg-red-800/18"
          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
    }`,
  detailHeaderShell: "grid gap-2",
  detailHeaderRow: "flex flex-wrap items-center gap-3",
  detailHeaderTitle: "min-w-0 text-2xl font-bold leading-tight",
  secondaryButton: (theme: SiteTheme) =>
    `inline-flex h-10 min-w-28 items-center justify-center rounded-md border px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
      theme === "dark"
        ? "border-white/[0.10] bg-transparent text-neutral-200 hover:bg-white/[0.08]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-transparent text-[#556145] hover:bg-[#E5D5BC]/55"
          : "border-neutral-300 bg-transparent text-neutral-800 hover:bg-neutral-100"
    }`,
  statusError: (theme: SiteTheme) =>
    `rounded-md border px-3 py-2 text-sm font-semibold ${
      theme === "dark"
        ? "border-red-400/30 bg-red-500/10 text-red-200"
        : theme === "paletteLight"
          ? "border-red-700/25 bg-red-700/10 text-red-800"
          : "border-red-200 bg-red-50 text-red-700"
    }`,
  cropPreview: (theme: SiteTheme) =>
    `aspect-square w-full overflow-hidden rounded-md border ${
      theme === "dark"
        ? "border-white/[0.10] bg-neutral-900"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-white"
          : "border-neutral-300 bg-neutral-100"
    }`,
  tabs: (theme: SiteTheme) =>
    `inline-flex h-9 overflow-hidden rounded-md border p-1 ${
      theme === "dark"
        ? "border-white/[0.08] bg-black/50"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35 bg-[#7A8864]"
          : "border-neutral-300 bg-neutral-200"
    }`,
  tab: (theme: SiteTheme, selected: boolean) =>
    `flex h-7 min-w-32 items-center justify-center rounded-md px-5 text-xs font-semibold transition-colors ${
      selected
        ? theme === "dark"
          ? "bg-black text-white"
          : theme === "paletteLight"
            ? "bg-[#F4EBCF] text-[#556145]"
            : "bg-neutral-900 text-white"
        : theme === "dark"
          ? "text-neutral-400 hover:text-white"
          : theme === "paletteLight"
            ? "text-[#FAF7F2]/75 hover:text-[#FAF7F2]"
            : "text-neutral-600 hover:text-neutral-900"
    }`,
  filterRail: (theme: SiteTheme) =>
    `col-span-2 rounded-md p-3 max-lg:col-span-12 ${
      theme === "dark"
        ? "bg-white/[0.04]"
        : theme === "paletteLight"
          ? "bg-[#E5D5BC]/45"
          : "bg-neutral-100"
    }`,
  filterGroup: (theme: SiteTheme) =>
    `border-b pb-3 pt-3 first:pt-0 last:border-b-0 last:pb-0 ${
      theme === "dark" ? "border-white/[0.16]" : theme === "paletteLight" ? "border-[#7A8864]/25" : "border-neutral-300"
    }`,
  filterLegend: (theme: SiteTheme) =>
    `text-sm font-bold ${theme === "dark" ? "text-neutral-100" : theme === "paletteLight" ? "text-[#556145]" : "text-neutral-900"}`,
  filterGroupHeader: "flex items-center justify-between gap-2",
  filterOptionList: "mt-2 flex flex-col gap-1",
  checkboxLabel: (theme: SiteTheme) =>
    `flex items-center gap-2 text-xs font-semibold ${
      theme === "dark" ? "text-neutral-300" : theme === "paletteLight" ? "text-[#556145]" : "text-neutral-700"
    }`,
  checkbox: "h-4 w-4 rounded border-neutral-400 accent-neutral-500",
  resultsWithFilters: "col-span-10 max-lg:col-span-12",
  recipeGrid: "grid grid-cols-4 gap-3 max-xl:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1",
  ingredientGrid: "grid grid-cols-3 items-start gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1",
  emptyFilterChipSlot: "h-9",
  recipeCard: (theme: SiteTheme) =>
    theme === "dark"
      ? "ring-1 ring-white/[0.08]"
      : theme === "paletteLight"
        ? "ring-1 ring-[#7A8864]/20"
        : "ring-1 ring-neutral-200",
  emptyState: (theme: SiteTheme) =>
    `flex min-h-80 flex-col items-center justify-center rounded-md border p-8 text-center ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035] text-neutral-200"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/70 text-[#556145]"
          : "border-neutral-200 bg-neutral-50 text-neutral-700"
    }`,
  emptyStateTitle: "text-2xl font-bold leading-[1.15]",
  emptyStateBody: "mt-2 max-w-xl text-base leading-[1.5]",
  detailShell: "mt-5 grid gap-5",
  recipeDetailHeroGrid: "grid grid-cols-[minmax(180px,260px)_minmax(0,1fr)] gap-5 max-md:grid-cols-1",
  recipeDetailImageFrame: "aspect-square overflow-hidden rounded-md bg-neutral-800",
  detailImage: "h-full w-full object-cover",
  detailImageFallback: "flex h-full w-full items-center justify-center px-4 text-center text-sm font-bold text-neutral-400",
  recipeDetailDescriptionWrap: "grid content-start",
  recipeDetailDescriptionPanel: "h-[260px] grid-rows-[auto_minmax(0,1fr)] max-md:h-auto",
  recipeDetailSplitGrid: "grid grid-cols-2 gap-5 max-md:grid-cols-1",
  detailSectionHeader: "flex flex-wrap items-center justify-between gap-3",
  detailSectionTitle: "text-sm font-bold uppercase tracking-wide",
  detailText: "self-start whitespace-pre-wrap text-left text-sm font-semibold leading-[1.55]",
  detailTextScrollable: "min-h-0 self-start overflow-y-auto whitespace-pre-wrap pr-1 text-left text-sm font-semibold leading-[1.55]",
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
  detailRowLabel: "font-bold",
  detailRowValue: "shrink-0",
  detailIngredientRow: (theme: SiteTheme) => `${recipeBrowserStyles.detailRow(theme)} flex-wrap`,
  detailIngredientName: "min-w-0 font-bold",
  ingredientDetailMetaGrid: "grid grid-cols-2 gap-3 max-sm:grid-cols-1",
  detailChipSection: "grid gap-2",
  detailChipList: "flex flex-wrap gap-2",
  nutritionGrid: "grid grid-cols-2 gap-2 max-sm:grid-cols-1",
  scaleLabel: "flex items-center gap-2",
  scaleField: "w-20",
  scaleInput: "w-full pr-6",
  imageCropper: "grid gap-3",
  hiddenFileInput: "sr-only",
  cropImage: "h-full w-full object-cover",
  cropFallback: "flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold opacity-60",
  cropControls: "grid gap-3",
  sliderField: "grid gap-1 text-xs font-bold",
  createOptionActions: "flex items-center justify-end gap-3",
  customSelectOptionLabel: "min-w-0 truncate",
  colorPickerActions: "flex items-center justify-end gap-3",
  filterIcon: "h-6 w-6",
  recipeIngredientThumbnailCompact: "h-8 px-3",
  nutritionSecondRowStart: "md:col-start-1",
};

export function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
