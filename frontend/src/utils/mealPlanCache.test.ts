import { describe, expect, it } from "vitest";
import type { IMealPlanEntry, MealSlot } from "../interfaces/IMeal";
import {
  acceptRangeResponse,
  datesInRange,
  emptyMealPlanCache,
  entriesInRange,
  isRangeLoaded,
  removeEntry,
  replaceRange,
  upsertEntry,
} from "./mealPlanCache";

function entry(mealPlanEntryId: number, date: string, slot: MealSlot = "Dinner", recipeId = 1): IMealPlanEntry {
  return {
    mealPlanEntryId,
    date,
    slot,
    notes: null,
    recipes: [
      { mealPlanRecipeId: mealPlanEntryId * 10, recipeId, ingredientId: null, role: "Main", sortOrder: 0, portions: 2, amount: null, unit: null },
    ],
  };
}

const week49 = { from: "2026-11-30", to: "2026-12-06" };
const week50 = { from: "2026-12-07", to: "2026-12-13" };

describe("datesInRange", () => {
  it("lists every date, across a month end and the October daylight saving change", () => {
    expect(datesInRange({ from: "2026-10-24", to: "2026-11-02" })).toEqual([
      "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28",
      "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02",
    ]);
  });
});

describe("replaceRange", () => {
  it("marks the range loaded and replaces only the entries inside it", () => {
    let state = replaceRange(emptyMealPlanCache, week49, [entry(1, "2026-11-30"), entry(2, "2026-12-06")]);
    state = replaceRange(state, week50, [entry(3, "2026-12-07")]);

    state = replaceRange(state, week49, [entry(4, "2026-12-01")]);

    expect(isRangeLoaded(state, week49)).toBe(true);
    expect(isRangeLoaded(state, week50)).toBe(true);
    expect(isRangeLoaded(state, { from: "2026-12-07", to: "2026-12-14" })).toBe(false);
    expect(entriesInRange(state.entries, week49).map((item) => item.mealPlanEntryId)).toEqual([4]);
    expect(entriesInRange(state.entries, week50).map((item) => item.mealPlanEntryId)).toEqual([3]);
  });

  it("does not change the state it was given", () => {
    const before = replaceRange(emptyMealPlanCache, week49, [entry(1, "2026-11-30")]);
    replaceRange(before, week49, []);

    expect(before.entries).toHaveLength(1);
    expect(emptyMealPlanCache.loadedDates.size).toBe(0);
  });
});

describe("upsertEntry and removeEntry", () => {
  it("replaces an entry by id and by date and slot", () => {
    let state = replaceRange(emptyMealPlanCache, week49, [entry(1, "2026-11-30"), entry(2, "2026-12-01")]);

    state = upsertEntry(state, entry(1, "2026-11-30", "Dinner", 7));
    state = upsertEntry(state, entry(9, "2026-12-01", "Dinner", 8));

    expect(state.entries.map((item) => [item.mealPlanEntryId, item.recipes[0]?.recipeId])).toEqual([[1, 7], [9, 8]]);
    expect(removeEntry(state, 9).entries.map((item) => item.mealPlanEntryId)).toEqual([1]);
  });
});

describe("acceptRangeResponse", () => {
  it("applies a response when nothing overtook it", () => {
    expect(acceptRangeResponse({ requestSequence: 3, latestAppliedSequence: 1, writeEpochAtStart: 4, writeEpochNow: 4 })).toBe("apply");
    expect(acceptRangeResponse({ requestSequence: 1, latestAppliedSequence: undefined, writeEpochAtStart: 0, writeEpochNow: 0 })).toBe("apply");
  });

  it("drops a response that a later request for the same range already answered", () => {
    expect(acceptRangeResponse({ requestSequence: 2, latestAppliedSequence: 5, writeEpochAtStart: 0, writeEpochNow: 0 })).toBe("drop");
  });

  it("asks again when a write started or finished while the request was out", () => {
    expect(acceptRangeResponse({ requestSequence: 3, latestAppliedSequence: 1, writeEpochAtStart: 4, writeEpochNow: 5 })).toBe("refetch");
  });

  it("keeps a slow response for the previous week from replacing the week on screen (AUDIT F1)", () => {
    // Next is clicked twice: week 49 is requested (1), then week 50 (2). Week 50 answers first.
    let state = replaceRange(emptyMealPlanCache, week50, [entry(50, "2026-12-07"), entry(51, "2026-12-08")]);
    // Week 49's late, empty answer is still accepted into the cache...
    expect(acceptRangeResponse({ requestSequence: 1, latestAppliedSequence: undefined, writeEpochAtStart: 0, writeEpochNow: 0 })).toBe("apply");
    state = replaceRange(state, week49, []);

    // ...but week 50, which is on screen, keeps its meals.
    expect(entriesInRange(state.entries, week50).map((item) => item.mealPlanEntryId)).toEqual([50, 51]);
    expect(isRangeLoaded(state, week49)).toBe(true);
  });
});
