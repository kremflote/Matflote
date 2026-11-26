// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IAssistantWriteLogEntry } from "../../interfaces/IAssistant";
import { jsonResponse, renderWithProviders, stubFetch } from "../../test/appTestHarness";
import AssistantLogPanel from "./AssistantLogPanel";

const mealPlanWrite: IAssistantWriteLogEntry = {
  id: 2,
  at: "2026-11-25T18:00:00Z",
  endpoint: "PUT /api/assistant/meal-plan",
  summary: "Meal plan 2026-11-30 to 2026-12-06: 7 created.",
  counts: { slotsCreated: 7 },
  canUndo: true,
  isNextUndo: true,
  from: "2026-11-30",
  to: "2026-12-06",
};

const importWrite: IAssistantWriteLogEntry = {
  id: 1,
  at: "2026-11-25T17:58:00Z",
  endpoint: "POST /api/assistant/recipes",
  summary: "Created recipes A, B, C.",
  counts: { recipesCreated: 3, ingredientsCreated: 4 },
  canUndo: false,
  isNextUndo: false,
};

const undoResult = (applied: boolean) => ({
  dryRun: false,
  applied,
  undoneWriteId: 2,
  undoneWriteSummary: mealPlanWrite.summary,
  errors: applied ? [] : ["These slots were changed after write 2."],
  slots: [{ date: "2026-11-30", slot: "Dinner", status: applied ? "cleared" : "changed_since", items: [], warnings: [] }],
});

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("AssistantLogPanel", () => {
  it("lists the latest writes and offers Undo on the newest meal plan change only", async () => {
    stubFetch((url) => (url.pathname === "/api/assistant/log" ? jsonResponse([mealPlanWrite, importWrite]) : undefined));

    renderWithProviders(<AssistantLogPanel />);

    const rows = await screen.findAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(/Meal plan · Nov 30 – Dec 6/)).toBeTruthy();
    expect(within(rows[0]).getByText(/7 meals planned/)).toBeTruthy();
    expect(within(rows[0]).getByRole("button", { name: "Undo" })).toBeTruthy();
    expect(within(rows[1]).getByText(/3 recipes added, 4 ingredients added/)).toBeTruthy();
    expect(within(rows[1]).queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("asks before undoing, and offers Undo anyway when the meals were changed since", async () => {
    let undoCalls = 0;
    const fetchMock = stubFetch((url) => {
      if (url.pathname === "/api/assistant/log") {
        return jsonResponse(undoCalls < 2 ? [mealPlanWrite, importWrite] : [{ ...mealPlanWrite, canUndo: false, isNextUndo: false, undoneAt: "2026-11-25T19:00:00Z" }]);
      }

      if (url.pathname === "/api/assistant/meal-plan/undo") {
        undoCalls += 1;
        return undoCalls === 1 ? jsonResponse(undoResult(false), 409) : jsonResponse(undoResult(true));
      }

      return undefined;
    });

    renderWithProviders(<AssistantLogPanel />);
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Meal plan · Nov 30 – Dec 6: 7 meals planned/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Undo" }));

    expect(await screen.findByText(/were changed after the assistant planned them/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Undo anyway" }));

    expect(await screen.findByText("Undone: 1 meal is back as it was.")).toBeTruthy();
    expect(await screen.findByText(/Undone Nov 25/)).toBeTruthy();
    const bodies = fetchMock.mock.calls
      .filter(([input]) => String(input).includes("/undo"))
      .map(([, init]) => JSON.parse(init!.body as string) as unknown);
    expect(bodies).toEqual([{ force: false }, { force: true }]);
  });
});
