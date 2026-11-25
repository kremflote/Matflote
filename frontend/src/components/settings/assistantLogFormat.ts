import type { TranslationDictionary } from "../../i18n";
import type { IAssistantWriteLogEntry } from "../../interfaces/IAssistant";

/** The order counts are listed in; anything else the server sends follows. */
const countOrder = [
  "recipesCreated",
  "recipesUpdated",
  "ingredientsCreated",
  "ingredientsUpdated",
  "recipesSkipped",
  "slotsCreated",
  "slotsReplaced",
  "slotsCleared",
  "slotsRestored",
  "slotsSkipped",
];

/** "Meal plan · 30 Nov – 6 Dec", "Recipes" and so on, in the UI's language. */
export function describeLogTitle(entry: IAssistantWriteLogEntry, t: TranslationDictionary, locale: string) {
  const label = t.assistantLog.endpoints[entry.endpoint] ?? entry.endpoint;
  if (entry.from === undefined || entry.to === undefined) {
    return label;
  }

  const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const from = format.format(parseDate(entry.from));
  const to = format.format(parseDate(entry.to));
  return `${label} · ${from === to ? from : `${from} – ${to}`}`;
}

/** "3 recipes added, 5 ingredients added": the non-zero counts in the UI's language. */
export function describeLogCounts(entry: IAssistantWriteLogEntry, t: TranslationDictionary) {
  const keys = Object.keys(entry.counts)
    .filter((key) => entry.counts[key] > 0)
    .sort((first, second) => rank(first) - rank(second));

  return keys
    .map((key) => t.assistantLog.counts[key]?.(entry.counts[key]) ?? `${key}: ${entry.counts[key]}`)
    .join(", ");
}

export function formatLogTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function rank(key: string) {
  const index = countOrder.indexOf(key);
  return index === -1 ? countOrder.length : index;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
