import type { PlannerViewMode } from "../interfaces/IMeal";

export function getVisibleRange(anchorDate: Date, viewMode: PlannerViewMode) {
  if (viewMode === "month") {
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
    const fromDate = getWeekStart(monthStart);
    const toDate = getWeekEnd(monthEnd);

    return {
      fromDate,
      toDate,
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
    };
  }

  const fromDate = getWeekStart(anchorDate);
  const toDate = getWeekEnd(anchorDate);

  return {
    fromDate,
    toDate,
    from: toDateInputValue(fromDate),
    to: toDateInputValue(toDate),
  };
}

export function getWeekRange(anchorDate: Date) {
  const fromDate = getWeekStart(anchorDate);
  const toDate = getWeekEnd(anchorDate);

  return {
    fromDate,
    toDate,
    from: toDateInputValue(fromDate),
    to: toDateInputValue(toDate),
  };
}

export function getClearRange(anchorDate: Date, viewMode: PlannerViewMode) {
  if (viewMode === "month") {
    const fromDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const toDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);

    return {
      from: toDateInputValue(fromDate),
      to: toDateInputValue(toDate),
    };
  }

  return {
    from: toDateInputValue(getWeekStart(anchorDate)),
    to: toDateInputValue(getWeekEnd(anchorDate)),
  };
}

export function getGenerationDates(anchorDate: Date, viewMode: PlannerViewMode) {
  if (viewMode === "month") {
    const fromDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const toDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);

    return getDatesInRange(fromDate, toDate);
  }

  return getDatesInRange(getWeekStart(anchorDate), getWeekEnd(anchorDate));
}

export function getAnchorLabel(
  anchorDate: Date,
  viewMode: PlannerViewMode,
  locale: string,
  formatWeekLabel: (week: number) => string,
) {
  if (viewMode === "month") {
    return capitalizeFirstLetter(new Intl.DateTimeFormat(locale, {
      month: "long",
    }).format(anchorDate));
  }

  return formatWeekLabel(getIsoWeek(anchorDate));
}

export function getAnchorYear(anchorDate: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
  }).format(anchorDate);
}

export function getDatesInRange(fromDate: Date, toDate: Date) {
  const dates: Date[] = [];
  let currentDate = stripTime(fromDate);

  while (currentDate <= toDate) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

export function addCalendarRange(date: Date, viewMode: PlannerViewMode, direction: -1 | 1) {
  if (viewMode === "month") {
    return new Date(date.getFullYear(), date.getMonth() + direction, 1);
  }

  return addDays(date, direction * 7);
}

export function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function capitalizeFirstLetter(value: string) {
  return value.length === 0 ? value : value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

function getWeekStart(date: Date) {
  const nextDate = stripTime(date);
  const day = nextDate.getDay() || 7;
  return addDays(nextDate, 1 - day);
}

function getWeekEnd(date: Date) {
  return addDays(getWeekStart(date), 6);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return stripTime(nextDate);
}

function getIsoWeek(date: Date) {
  const nextDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = nextDate.getUTCDay() || 7;
  nextDate.setUTCDate(nextDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(nextDate.getUTCFullYear(), 0, 1));

  return Math.ceil(((nextDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
