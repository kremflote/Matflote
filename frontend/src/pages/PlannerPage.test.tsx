// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, stubFetch, stubMatchMedia } from "../test/appTestHarness";
import PlannerPage from "./PlannerPage";

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
  vi.useFakeTimers({ toFake: ["Date"] });
  // Wednesday 25 November 2026 is in ISO week 48.
  vi.setSystemTime(new Date(2026, 10, 25, 12, 0));
  stubMatchMedia();
  stubFetch();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
});

const renderPlanner = () => renderWithProviders(<PlannerPage />);
// Each slot is named by its day and meal, for example "Wednesday, November 25, dinner: empty, add a meal".
const mealSlotName = /, (breakfast|lunch|dinner): /;

describe("PlannerPage week on opening (F6)", () => {
  it("opens on the current week even when an earlier visit viewed another week", async () => {
    // What earlier versions stored in localStorage when the planner was left on week 2.
    localStorage.setItem("matflote:planner-week-anchor-date", "2026-01-05");

    renderPlanner();

    expect(await screen.findByText("Week 48")).toBeTruthy();
  });

  it("goes back to the current week with the Today button", async () => {
    renderPlanner();
    await screen.findByText("Week 48");

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(await screen.findByText("Week 50")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(await screen.findByText("Week 48")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Today" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("remembers the week viewed only for the browser session", async () => {
    const { unmount } = renderPlanner();
    await screen.findByText("Week 48");
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    await screen.findByText("Week 49");
    unmount();

    expect(sessionStorage.getItem("matflote:planner-week-anchor-date")).toBe("2026-12-02");
    expect(localStorage.getItem("matflote:planner-week-anchor-date")).toBeNull();

    // Same tab: back on the week last viewed.
    renderPlanner();
    expect(await screen.findByText("Week 49")).toBeTruthy();
    cleanup();

    // A new session (sessionStorage is per tab): back on today.
    sessionStorage.clear();
    renderPlanner();
    expect(await screen.findByText("Week 48")).toBeTruthy();
  });

  it("still opens when storage is blocked", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    try {
      renderPlanner();
      expect(await screen.findByText("Week 48")).toBeTruthy();
      await act(async () => undefined);
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});

describe("PlannerPage when the meal plan cannot be loaded (F7)", () => {
  it("shows an error with Retry and keeps the slots disabled until the plan is known", async () => {
    let backendUp = false;
    stubFetch((url) =>
      url.pathname === "/api/mealplans" && !backendUp
        ? new Response("<html><body><h1>502 Bad Gateway</h1></body></html>", { status: 502, headers: { "Content-Type": "text/html" } })
        : undefined,
    );

    renderPlanner();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not load meal plan.");
    expect(alert.textContent).toContain("status 502");
    expect(alert.textContent).not.toContain("<");
    const slots = screen.getAllByRole("button", { name: mealSlotName });
    expect(slots).toHaveLength(21);
    expect(slots.every((slot) => (slot as HTMLButtonElement).disabled)).toBe(true);
    expect((screen.getByRole("button", { name: "Generate meal plan" }) as HTMLButtonElement).disabled).toBe(true);

    backendUp = true;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(
      screen.getAllByRole("button", { name: mealSlotName }).every((slot) => !(slot as HTMLButtonElement).disabled),
    ).toBe(true);
  });
});

describe("PlannerPage slot names (F22)", () => {
  it("gives each of the 21 slots its own accessible name", async () => {
    renderPlanner();

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: mealSlotName }).every((slot) => !(slot as HTMLButtonElement).disabled)).toBe(true),
    );
    const names = screen.getAllByRole("button", { name: mealSlotName }).map((slot) => slot.getAttribute("aria-label"));
    expect(names).toHaveLength(21);
    expect(new Set(names).size).toBe(21);
    expect(names).toContain("Wednesday, November 25, dinner: empty, add a meal");
  });
});
