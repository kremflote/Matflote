const keyPrefix = "matflote";

export const localPreferenceKeys = {
  activePage: `${keyPrefix}:active-page`,
  cookbookMode: `${keyPrefix}:cookbook-mode`,
  language: `${keyPrefix}:language`,
  plannerCollapsedDateKeys: `${keyPrefix}:planner-collapsed-date-keys`,
  plannerAnchorDate: `${keyPrefix}:planner-anchor-date`,
  plannerPeopleEating: `${keyPrefix}:planner-people-eating`,
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

export function getLocalNumberPreference(key: string, fallback: number) {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) {
    return fallback;
  }

  const parsedValue = Number(storedValue);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function setLocalPreference(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function getLocalStringListPreference(key: string) {
  const storedValue = localStorage.getItem(key);
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
  localStorage.setItem(key, JSON.stringify([...values]));
}
