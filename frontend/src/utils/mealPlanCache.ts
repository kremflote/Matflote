import type { IMealPlanEntry } from "../interfaces/IMeal";

/**
 * The planner's client-side store of meal plan entries.
 *
 * Entries from every range loaded in this session live in one list, so the week and month views and
 * the prefetched neighbours stay consistent after a write. `loadedDates` records which dates a
 * response has covered: a range whose dates are all covered can be shown at once while it is
 * revalidated in the background.
 *
 * Dates are ISO `yyyy-mm-dd` strings, which compare correctly as strings.
 */
export interface MealPlanCacheState {
  entries: IMealPlanEntry[];
  loadedDates: ReadonlySet<string>;
}

export interface DateRange {
  from: string;
  to: string;
}

export const emptyMealPlanCache: MealPlanCacheState = {
  entries: [],
  loadedDates: new Set<string>(),
};

export function datesInRange({ from, to }: DateRange): string[] {
  const dates: string[] = [];
  const current = parseIsoDate(from);
  const last = parseIsoDate(to);

  while (current <= last) {
    dates.push(toIsoDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function isRangeLoaded(state: MealPlanCacheState, range: DateRange) {
  return datesInRange(range).every((date) => state.loadedDates.has(date));
}

export function entriesInRange(entries: IMealPlanEntry[], { from, to }: DateRange) {
  return entries.filter((entry) => entry.date >= from && entry.date <= to);
}

/** Replaces everything in the range with the given entries, which are the complete content of that range. */
export function replaceRange(state: MealPlanCacheState, range: DateRange, entries: IMealPlanEntry[]): MealPlanCacheState {
  const loadedDates = new Set(state.loadedDates);
  datesInRange(range).forEach((date) => loadedDates.add(date));

  return {
    entries: [
      ...state.entries.filter((entry) => entry.date < range.from || entry.date > range.to),
      ...entries,
    ],
    loadedDates,
  };
}

export function upsertEntry(state: MealPlanCacheState, entry: IMealPlanEntry): MealPlanCacheState {
  return {
    ...state,
    entries: [
      ...state.entries.filter(
        (current) =>
          current.mealPlanEntryId !== entry.mealPlanEntryId &&
          !(current.date === entry.date && current.slot === entry.slot),
      ),
      entry,
    ],
  };
}

export function removeEntry(state: MealPlanCacheState, mealPlanEntryId: number): MealPlanCacheState {
  return {
    ...state,
    entries: state.entries.filter((entry) => entry.mealPlanEntryId !== mealPlanEntryId),
  };
}

/**
 * Decides what to do with a GET response for a range.
 *
 * - A response that an earlier-started request for the same range overtook is dropped.
 * - A response for a request that started before a write (still running or finished since) may hold
 *   the data from before the write, so it is dropped and the range should be fetched again.
 *
 * Responses for a range other than the one on screen still fill the cache: entries are stored by
 * date, so they cannot replace what is shown for another range (AUDIT F1).
 */
export function acceptRangeResponse({
  requestSequence,
  latestAppliedSequence,
  writeEpochAtStart,
  writeEpochNow,
}: {
  requestSequence: number;
  latestAppliedSequence: number | undefined;
  writeEpochAtStart: number;
  writeEpochNow: number;
}): "apply" | "drop" | "refetch" {
  if (latestAppliedSequence !== undefined && requestSequence < latestAppliedSequence) {
    return "drop";
  }

  if (writeEpochAtStart !== writeEpochNow) {
    return "refetch";
  }

  return "apply";
}

export function rangeKey({ from, to }: DateRange) {
  return `${from}..${to}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
