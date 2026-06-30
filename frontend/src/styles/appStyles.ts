export type SiteTheme = "dark" | "light" | "paletteLight";

export const colorPalette = {
  dustyBlue: "#A9BDD1",
  olive: "#7A8864",
  stone: "#C8C0B5",
  champagne: "#E5D5BC",
  ivory: "#FAF7F2",
} as const;

export const colorPaletteClasses = {
  background: {
    dustyBlue: "bg-[#A9BDD1]",
    olive: "bg-[#7A8864]",
    stone: "bg-[#C8C0B5]",
    champagne: "bg-[#E5D5BC]",
    ivory: "bg-[#FAF7F2]",
  },
  border: {
    dustyBlue: "border-[#A9BDD1]",
    olive: "border-[#7A8864]",
    stone: "border-[#C8C0B5]",
    champagne: "border-[#E5D5BC]",
    ivory: "border-[#FAF7F2]",
  },
  text: {
    dustyBlue: "text-[#A9BDD1]",
    olive: "text-[#7A8864]",
    stone: "text-[#C8C0B5]",
    champagne: "text-[#E5D5BC]",
    ivory: "text-[#FAF7F2]",
  },
} as const;

export const siteColorClasses = {
  dark: {
    page: "bg-[#111111] text-neutral-50 before:bg-white/[0.03]",
    header: "border-white/[0.08] bg-white/[0.06]",
    headerForeground: "text-neutral-50",
    nav: "border-white/[0.08] bg-white/[0.04]",
    control: "text-neutral-300 hover:border-white/[0.14] hover:bg-white/[0.12] hover:text-neutral-50",
    controlSelected: "border-white/[0.14] bg-white/[0.12] text-neutral-50",
    plannerControl: "border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.12]",
    plannerDateItem: "bg-white/[0.12]",
    plannerCounter: "border-white/[0.10] bg-white/[0.06] text-white",
    plannerCounterMuted: "text-neutral-300",
    plannerCounterAccent: "text-neutral-50",
    plannerToggle: "border-white/[0.14] bg-black/50 text-neutral-300",
    plannerToggleSelected: "bg-white/[0.14] text-white",
    plannerToggleIdle: "hover:bg-white/[0.08] hover:text-white",
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
    control: "text-neutral-600 hover:border-neutral-300 hover:bg-neutral-200 hover:text-neutral-900",
    controlSelected: "border-neutral-300 bg-neutral-200 text-neutral-900",
    plannerControl: "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
    plannerDateItem: "bg-neutral-200",
    plannerCounter: "border-neutral-200 bg-neutral-100 text-neutral-900",
    plannerCounterMuted: "text-neutral-500",
    plannerCounterAccent: "text-neutral-950",
    plannerToggle: "border-neutral-300 bg-neutral-300 text-neutral-700",
    plannerToggleSelected: "bg-neutral-900 text-white",
    plannerToggleIdle: "hover:bg-neutral-200 hover:text-neutral-900",
    switchTrack: "border-neutral-300 bg-neutral-200",
    switchThumb: "bg-neutral-900 text-white",
    dayCell: "bg-black/20 text-white",
    mealHeaderCell: "bg-black/20 text-white",
    focus: "focus-visible:outline-neutral-800",
  },
  paletteLight: {
    page: "bg-[#FAF7F2] text-[#7A8864] before:bg-[#A9BDD1]/20",
    header: "border-[#7A8864]/35 bg-[#7A8864]",
    headerForeground: "text-[#E5D5BC]",
    nav: "border-[#C8C0B5] bg-[#FAF7F2]/55",
    control: "text-[#E5D5BC] hover:border-[#E5D5BC]/45 hover:bg-[#E5D5BC]/15 hover:text-[#FAF7F2]",
    controlSelected: "border-[#E5D5BC]/55 bg-[#E5D5BC]/20 text-[#FAF7F2]",
    plannerControl: "border-[#7A8864]/35 bg-[#FAF7F2]/35 text-[#556145] hover:bg-[#FAF7F2]/55",
    plannerDateItem: "bg-[#C8C0B5]/70",
    plannerCounter: "border-[#C8C0B5] bg-[#E5D5BC]/60 text-[#556145]",
    plannerCounterMuted: "text-[#7A8864]",
    plannerCounterAccent: "text-[#556145]",
    plannerToggle: "border-[#7A8864]/35 bg-[#7A8864] text-[#FAF7F2]/75",
    plannerToggleSelected: "bg-[#FAF7F2] text-[#556145]",
    plannerToggleIdle: "hover:bg-[#A9BDD1]/35 hover:text-[#FAF7F2]",
    switchTrack: "border-[#7A8864]/35 bg-[#C8C0B5]",
    switchThumb: "bg-[#FAF7F2] text-[#7A8864]",
    dayCell: "bg-[#7A8864] text-[#FAF7F2]",
    mealHeaderCell: "bg-[#7A8864] text-[#FAF7F2]",
    focus: "focus-visible:outline-[#7A8864]",
  },
} as const;

export const typographyClasses = {
  app: "font-['Nunito',system-ui,sans-serif]",
  hero: "font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive]",
  logo: "font-['Segoe_Print','Bradley_Hand','Comic_Sans_MS',cursive] text-2xl font-bold leading-[1.1]",
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
  plannerControlHeight: "h-12",
  plannerControlsBlockHeight: "h-20",
  dayLabelHeight: "h-auto",
  mealSlotPlaceholder: "h-12 w-12",
} as const;

export const radiusClasses = {
  figma6: "rounded-md",
} as const;

const focusBase =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export const appStyles = {
  shell: (theme: SiteTheme) =>
    `relative min-h-screen overflow-x-clip before:pointer-events-none before:absolute before:inset-0 before:content-[''] ${typographyClasses.app} ${siteColorClasses[theme].page}`,
  overlay: "relative min-h-screen",
  contentBackground: "bg-transparent",
};

export const headerStyles = {
  shell: (theme: SiteTheme) =>
    `relative z-10 min-h-20 border-b ${siteColorClasses[theme].header}`,
  inner: `${layoutClasses.contentWidth} grid min-h-20 grid-cols-[1fr_auto_1fr] items-center gap-6 max-md:grid-cols-[1fr_auto] max-md:grid-rows-[auto_auto] max-md:gap-4 max-md:py-4`,
  logo: (theme: SiteTheme) =>
    `justify-self-start no-underline ${typographyClasses.logo} ${siteColorClasses[theme].headerForeground}`,
  nav: "flex items-center justify-center gap-2 max-md:col-span-2 max-md:row-start-2 max-md:justify-self-center",
  navButton: (theme: SiteTheme, selected: boolean) =>
    `inline-flex h-16 min-w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border bg-transparent px-3 transition-colors duration-150 ${focusBase} ${siteColorClasses[theme].focus} ${
      selected ? siteColorClasses[theme].controlSelected : `border-transparent ${siteColorClasses[theme].control}`
    }`,
  icon: "h-8 w-8 fill-current",
  navLabel: "text-xs font-semibold leading-none",
  themeButton: (theme: SiteTheme) =>
    `inline-flex h-8 w-14 cursor-pointer items-center justify-center justify-self-end rounded-full border border-transparent bg-transparent p-0 ${focusBase} ${siteColorClasses[theme].focus}`,
  themeTrack: (theme: SiteTheme) =>
    `relative h-8 w-14 rounded-full border ${siteColorClasses[theme].switchTrack}`,
  themeThumb: (theme: SiteTheme) =>
    `absolute left-[3px] top-[3px] inline-flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 ${
      theme !== "dark" ? "translate-x-6" : ""
    } ${siteColorClasses[theme].switchThumb}`,
  themeIcon: "h-4 w-4 fill-current",
};

export const pageStyles = {
  shell: `${layoutClasses.contentWidth} relative py-16`,
  showColumnDebugOverlay: false,
  columnDebugOverlay:
    "pointer-events-none absolute inset-y-0 left-0 right-0 grid grid-cols-12 gap-6 opacity-100",
  columnDebugCell: "bg-red-500/10 outline outline-1 outline-red-500/30",
};

export const plannerControlsStyles = {
  shell: `mb-6 grid w-full grid-cols-12 ${layoutClasses.gridGap}`,
  datePrimaryRow: `flex w-full items-center justify-center ${layoutClasses.controlGap}`,
  datePrimary: (theme: SiteTheme) =>
    `text-[40px] font-semibold leading-[1.15] ${siteColorClasses[theme].plannerCounterAccent}`,
  leftCell: "col-span-4 flex items-center justify-start",
  centerCell: "col-span-4 flex items-center justify-center",
  rightCell: "col-span-4 flex items-center justify-end",
  counterActions: `flex w-full items-center justify-start ${layoutClasses.tightControlGap}`,
  actionSlotLeft: "flex",
  actionSlotCenter: "flex",
  actionSlotRight: "flex",
  button: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} inline-flex max-w-full items-center justify-center ${layoutClasses.controlGap} ${radiusClasses.figma6} border px-6 text-center text-base font-semibold leading-tight transition-colors duration-150 ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerControl}`,
  iconOnlyButton: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} group relative inline-flex aspect-square items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerControl}`,
  iconButton: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} inline-flex aspect-square items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerControl}`,
  buttonIcon: "h-4 w-4 fill-current",
  tooltip: (theme: SiteTheme) =>
    `pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap ${radiusClasses.figma6} border px-3 py-2 text-sm font-semibold opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${siteColorClasses[theme].plannerControl}`,
  viewToggle: (theme: SiteTheme) =>
    `${sizeClasses.plannerControlHeight} inline-flex items-center overflow-hidden ${radiusClasses.figma6} border p-0 ${focusBase} ${siteColorClasses[theme].focus} ${siteColorClasses[theme].plannerToggle}`,
  viewToggleOption: (theme: SiteTheme, selected: boolean) =>
    `flex h-full items-center justify-center ${radiusClasses.figma6} px-6 text-base font-semibold transition-colors duration-150 ${
      selected ? siteColorClasses[theme].plannerToggleSelected : siteColorClasses[theme].plannerToggleIdle
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
    `absolute right-full top-0 flex w-20 ${sizeClasses.mealCalendarCellHeight} flex-col items-center justify-center ${radiusClasses.figma6} ${siteColorClasses[theme].dayCell}`,
  dayLabel: `${sizeClasses.dayLabelHeight} flex items-center justify-center text-center ${typographyClasses.dayLabel}`,
  mealSlot: (theme: SiteTheme) =>
    `col-span-4 flex ${sizeClasses.mealCalendarCellHeight} items-center justify-center ${radiusClasses.figma6} border transition-colors duration-150 ${
      theme === "dark"
        ? "border-white/[0.08] bg-white/[0.035] hover:bg-white/[0.06]"
        : theme === "paletteLight"
          ? "border-[#C8C0B5] bg-[#FAF7F2]/70 hover:bg-[#E5D5BC]/45"
        : "border-neutral-200 bg-white hover:bg-neutral-50"
    }`,
  mealSlotInner: (theme: SiteTheme) =>
    `${sizeClasses.mealSlotPlaceholder} ${radiusClasses.figma6} border border-dashed ${
      theme === "dark"
        ? "border-white/[0.14]"
        : theme === "paletteLight"
          ? "border-[#7A8864]/35"
        : "border-neutral-300"
    }`,
};
