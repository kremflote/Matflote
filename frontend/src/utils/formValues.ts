/** Helpers for form fields that hold numbers and lists as text. */

/**
 * The number in a text field, or null when it is empty or not a number. A comma works as the decimal mark, as
 * Norwegian keyboards type it ("2,5" is 2.5).
 */
export function parseOptionalNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** The text for a number field: empty for no value. */
export function numberToInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : value.toString();
}

/** Adds the value to the list, or takes it out if it is there. */
export function toggleValue<TValue>(values: TValue[], value: TValue) {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}
