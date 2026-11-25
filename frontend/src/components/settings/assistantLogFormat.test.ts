import { describe, expect, it } from "vitest";
import { en } from "../../i18n/en";
import { nb } from "../../i18n/nb";
import type { IAssistantWriteLogEntry } from "../../interfaces/IAssistant";
import { describeLogCounts, describeLogTitle } from "./assistantLogFormat";

const entry = (overrides: Partial<IAssistantWriteLogEntry>): IAssistantWriteLogEntry => ({
  id: 1,
  at: "2026-11-25T18:00:00Z",
  endpoint: "PUT /api/assistant/meal-plan",
  summary: "Meal plan 2026-11-30 to 2026-12-06: 5 created, 2 cleared.",
  counts: {},
  canUndo: true,
  isNextUndo: true,
  ...overrides,
});

describe("assistant log formatting", () => {
  it("names a meal plan change with its dates", () => {
    expect(describeLogTitle(entry({ from: "2026-11-30", to: "2026-12-06" }), en, "en-GB")).toBe("Meal plan · 30 Nov – 6 Dec");
    expect(describeLogTitle(entry({ from: "2026-11-30", to: "2026-11-30" }), nb, "nb-NO")).toBe("Måltidsplan · 30. nov.");
  });

  it("names other writes by their endpoint and keeps unknown endpoints as they are", () => {
    expect(describeLogTitle(entry({ endpoint: "POST /api/assistant/recipes" }), nb, "nb-NO")).toBe("Oppskrifter");
    expect(describeLogTitle(entry({ endpoint: "POST /api/assistant/other" }), en, "en-GB")).toBe("POST /api/assistant/other");
  });

  it("lists the non-zero counts in a fixed order, in the UI's language", () => {
    const counts = { ingredientsCreated: 5, recipesCreated: 3, recipesUpdated: 0, somethingNew: 2 };
    expect(describeLogCounts(entry({ counts }), en)).toBe("3 recipes added, 5 ingredients added, somethingNew: 2");
    expect(describeLogCounts(entry({ counts: { slotsCreated: 1, slotsCleared: 2 } }), nb)).toBe("1 måltid planlagt, 2 fjernet");
  });
});
