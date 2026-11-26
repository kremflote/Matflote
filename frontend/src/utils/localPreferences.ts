const keyPrefix = "matflote";

export const localPreferenceKeys = {
  activePage: `${keyPrefix}:active-page`,
  cookbookMode: `${keyPrefix}:cookbook-mode`,
  language: `${keyPrefix}:language`,
  plannerCollapsedDateKeys: `${keyPrefix}:planner-collapsed-date-keys`,
  plannerPeopleEating: `${keyPrefix}:planner-people-eating`,
  plannerViewMode: `${keyPrefix}:planner-view-mode`,
  theme: `${keyPrefix}:theme`,
} as const;

/** Kept only for the browser session (the tab), so a fresh visit starts on the current week. */
export const sessionPreferenceKeys = {
  plannerMonthAnchorDate: `${keyPrefix}:planner-month-anchor-date`,
  plannerWeekAnchorDate: `${keyPrefix}:planner-week-anchor-date`,
} as const;

/** Earlier versions kept the last-viewed planner week in localStorage; it is no longer read. */
const retiredLocalPreferenceKeys = [
  `${keyPrefix}:planner-anchor-date`,
  `${keyPrefix}:planner-month-anchor-date`,
  `${keyPrefix}:planner-week-anchor-date`,
];

type StorageKind = "local" | "session";

// Storage can be missing or throw (private windows, blocked site data). Preferences are a
// convenience, so every access falls back to "nothing stored" instead of breaking the page.
function getStorage(kind: StorageKind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch (_error) {
    return null;
  }
}

function readItem(kind: StorageKind, key: string) {
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch (_error) {
    return null;
  }
}

function writeItem(kind: StorageKind, key: string, value: string) {
  try {
    getStorage(kind)?.setItem(key, value);
  } catch (_error) {
    // Not stored; the default is used next time.
  }
}

function removeItem(kind: StorageKind, key: string) {
  try {
    getStorage(kind)?.removeItem(key);
  } catch (_error) {
    // Nothing to clean up.
  }
}

function parseDateValue(storedValue: string | null, fallback: Date) {
  if (storedValue === null) {
    return fallback;
  }

  const parsedDate = new Date(`${storedValue}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? fallback : parsedDate;
}

export function getLocalPreference<TValue extends string>(
  key: string,
  allowedValues: readonly TValue[],
  fallback: TValue,
) {
  return getOptionalLocalPreference(key, allowedValues) ?? fallback;
}

export function getOptionalLocalPreference<TValue extends string>(
  key: string,
  allowedValues: readonly TValue[],
) {
  const storedValue = readItem("local", key);
  return allowedValues.includes(storedValue as TValue) ? (storedValue as TValue) : null;
}

export function getLocalNumberPreference(key: string, fallback: number) {
  const storedValue = readItem("local", key);
  if (storedValue === null) {
    return fallback;
  }

  const parsedValue = Number(storedValue);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function setLocalPreference(key: string, value: string) {
  writeItem("local", key, value);
}

export function getLocalStringListPreference(key: string) {
  const storedValue = readItem("local", key);
  if (storedValue === null) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;
    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === "string")
      : [];
  } catch (_error) {
    return [];
  }
}

export function setLocalStringListPreference(key: string, values: Iterable<string>) {
  writeItem("local", key, JSON.stringify([...values]));
}

export function getSessionDatePreference(key: string, fallback: Date) {
  return parseDateValue(readItem("session", key), fallback);
}

export function setSessionPreference(key: string, value: string) {
  writeItem("session", key, value);
}

export function removeRetiredLocalPreferences() {
  for (const key of retiredLocalPreferenceKeys) {
    removeItem("local", key);
  }
}
