const keyPrefix = "matflote";

export const localPreferenceKeys = {
  activePage: `${keyPrefix}:active-page`,
  cookbookMode: `${keyPrefix}:cookbook-mode`,
  language: `${keyPrefix}:language`,
  plannerAnchorDate: `${keyPrefix}:planner-anchor-date`,
  plannerViewMode: `${keyPrefix}:planner-view-mode`,
  theme: `${keyPrefix}:theme`,
} as const;

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
  const storedValue = localStorage.getItem(key);
  return allowedValues.includes(storedValue as TValue) ? (storedValue as TValue) : null;
}

export function getLocalDatePreference(key: string, fallback: Date) {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) {
    return fallback;
  }

  const parsedDate = new Date(`${storedValue}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? fallback : parsedDate;
}

export function setLocalPreference(key: string, value: string) {
  localStorage.setItem(key, value);
}
