import { describe, expect, it } from "vitest";
import {
  addCalendarRange,
  getAnchorLabel,
  getAnchorYear,
  getClearRange,
  getDatesInRange,
  getGenerationDates,
  getVisibleRange,
  getWeekRange,
  stripTime,
  toDateInputValue,
} from "./plannerDate";

// Months are zero-based in the Date constructor: new Date(2026, 10, 25) is 25 November 2026.
const date = (year: number, month: number, day: number, hours = 0) => new Date(year, month - 1, day, hours);
const keys = (dates: Date[]) => dates.map(toDateInputValue);

describe("toDateInputValue", () => {
  it("formats the local calendar date with zero padding", () => {
    expect(toDateInputValue(date(2026, 1, 5))).toBe("2026-01-05");
    expect(toDateInputValue(date(2026, 12, 31, 23))).toBe("2026-12-31");
  });
});

describe("stripTime", () => {
  it("drops the time of day", () => {
    const stripped = stripTime(new Date(2026, 10, 25, 18, 45, 12));
    expect(stripped.getHours()).toBe(0);
    expect(stripped.getMinutes()).toBe(0);
    expect(toDateInputValue(stripped)).toBe("2026-11-25");
  });
});

describe("getWeekRange", () => {
  it("runs Monday to Sunday for a midweek date", () => {
    const range = getWeekRange(date(2026, 11, 25, 15));
    expect(range.from).toBe("2026-11-23");
    expect(range.to).toBe("2026-11-29");
    expect(range.fromDate.getDay()).toBe(1);
    expect(range.toDate.getDay()).toBe(0);
  });

  it("treats Sunday as the last day of its week", () => {
    const range = getWeekRange(date(2026, 11, 29));
    expect(range.from).toBe("2026-11-23");
    expect(range.to).toBe("2026-11-29");
  });

  it("treats Monday as the first day of its week", () => {
    expect(getWeekRange(date(2026, 11, 30)).from).toBe("2026-11-30");
  });

  it("crosses month and year boundaries", () => {
    const range = getWeekRange(date(2027, 1, 1));
    expect(range.from).toBe("2026-12-28");
    expect(range.to).toBe("2027-01-03");
  });
});

describe("getVisibleRange", () => {
  it("is the week in week view", () => {
    const range = getVisibleRange(date(2026, 11, 25), "week");
    expect([range.from, range.to]).toEqual(["2026-11-23", "2026-11-29"]);
  });

  it("covers whole weeks around the month in month view", () => {
    // November 2026 starts on a Sunday and ends on a Monday.
    const range = getVisibleRange(date(2026, 11, 25), "month");
    expect(range.from).toBe("2026-10-26");
    expect(range.to).toBe("2026-12-06");
  });

  it("needs no padding when the month starts on Monday and ends on Sunday", () => {
    // February 2027 runs Monday 1 to Sunday 28.
    const range = getVisibleRange(date(2027, 2, 14), "month");
    expect([range.from, range.to]).toEqual(["2027-02-01", "2027-02-28"]);
  });
});

describe("getClearRange", () => {
  it("is the week in week view", () => {
    expect(getClearRange(date(2026, 11, 25), "week")).toEqual({ from: "2026-11-23", to: "2026-11-29" });
  });

  it("is the calendar month only in month view", () => {
    expect(getClearRange(date(2026, 11, 25), "month")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(getClearRange(date(2028, 2, 10), "month")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });
});

describe("getGenerationDates", () => {
  it("lists the seven days of the week", () => {
    expect(keys(getGenerationDates(date(2026, 11, 25), "week"))).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
  });

  it("lists every day of the month", () => {
    const dates = keys(getGenerationDates(date(2026, 11, 25), "month"));
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe("2026-11-01");
    expect(dates.at(-1)).toBe("2026-11-30");
  });
});

describe("getDatesInRange", () => {
  it("includes both ends and ignores the time of the start", () => {
    expect(keys(getDatesInRange(date(2026, 3, 27, 22), date(2026, 3, 30)))).toEqual([
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
      "2026-03-30",
    ]);
  });

  it("is empty when the range is reversed", () => {
    expect(getDatesInRange(date(2026, 3, 30), date(2026, 3, 27))).toEqual([]);
  });

  it("steps one calendar day at a time across daylight saving changes", () => {
    // Europe moves clocks forward on 29 March 2026 and back on 25 October 2026.
    expect(getDatesInRange(date(2026, 3, 1), date(2026, 3, 31))).toHaveLength(31);
    expect(getDatesInRange(date(2026, 10, 1), date(2026, 10, 31))).toHaveLength(31);
  });
});

describe("addCalendarRange", () => {
  it("moves by seven days in week view", () => {
    expect(toDateInputValue(addCalendarRange(date(2026, 11, 25), "week", 1))).toBe("2026-12-02");
    expect(toDateInputValue(addCalendarRange(date(2026, 11, 25), "week", -1))).toBe("2026-11-18");
  });

  it("moves to the first of the next or previous month in month view", () => {
    expect(toDateInputValue(addCalendarRange(date(2026, 1, 31), "month", 1))).toBe("2026-02-01");
    expect(toDateInputValue(addCalendarRange(date(2026, 1, 15), "month", -1))).toBe("2025-12-01");
  });
});

describe("getAnchorLabel", () => {
  const weekLabel = (week: number) => `Week ${week}`;

  it("shows the ISO week number in week view", () => {
    expect(getAnchorLabel(date(2026, 11, 25), "week", "en", weekLabel)).toBe("Week 48");
    // 1 January 2027 is a Friday, so it belongs to week 53 of 2026.
    expect(getAnchorLabel(date(2027, 1, 1), "week", "en", weekLabel)).toBe("Week 53");
    // 29 December 2025 is a Monday in week 1 of 2026.
    expect(getAnchorLabel(date(2025, 12, 29), "week", "en", weekLabel)).toBe("Week 1");
  });

  it("shows the capitalised month name in month view", () => {
    expect(getAnchorLabel(date(2026, 11, 25), "month", "en", weekLabel)).toBe("November");
    expect(getAnchorLabel(date(2026, 11, 25), "month", "nb", weekLabel)).toBe("November");
    expect(getAnchorLabel(date(2026, 1, 25), "month", "nb", weekLabel)).toBe("Januar");
  });
});

describe("getAnchorYear", () => {
  it("is the calendar year of the anchor in month view", () => {
    expect(getAnchorYear(date(2026, 11, 25), "month", "en")).toBe("2026");
    expect(getAnchorYear(date(2025, 12, 29), "month", "en")).toBe("2025");
  });

  it("is the ISO week-year in week view, so it matches the week number (F8)", () => {
    expect(getAnchorYear(date(2026, 11, 25), "week", "en")).toBe("2026");
    // Monday 29 December 2025 starts week 1 of 2026.
    expect(getAnchorYear(date(2025, 12, 29), "week", "en")).toBe("2026");
    expect(getAnchorYear(date(2025, 12, 31), "week", "en")).toBe("2026");
    // Friday 1 January 2027 is in week 53 of 2026.
    expect(getAnchorYear(date(2027, 1, 1), "week", "en")).toBe("2026");
    expect(getAnchorYear(date(2027, 1, 3), "week", "en")).toBe("2026");
    expect(getAnchorYear(date(2027, 1, 4), "week", "en")).toBe("2027");
  });
});
