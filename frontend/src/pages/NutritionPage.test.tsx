// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../contexts";
import { nutritionService } from "../services";
import NutritionPage from "./NutritionPage";

vi.mock("../services", async (importOriginal) => {
  const original = await importOriginal<typeof import("../services")>();
  return {
    ...original,
    nutritionService: {
      ...original.nutritionService,
      getProfilePreference: vi.fn(() => new Promise(() => undefined)),
      getWeeklySummary: vi.fn(() => new Promise(() => undefined)),
    },
  };
});

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.mocked(nutritionService.getWeeklySummary).mockClear();
});

// The tests run with TZ=Europe/Oslo (see vite.config.ts), east of UTC.
describe("NutritionPage week (F3)", () => {
  it.each([
    ["a Wednesday afternoon", new Date(2026, 10, 25, 15, 0)],
    ["just after midnight on Monday", new Date(2026, 10, 23, 0, 30)],
    ["late on Sunday", new Date(2026, 10, 29, 23, 30)],
  ])("asks for Monday to Sunday on %s", async (_label, now) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);

    render(
      <LanguageProvider>
        <NutritionPage />
      </LanguageProvider>,
    );

    await waitFor(() => expect(nutritionService.getWeeklySummary).toHaveBeenCalled());
    const [from, to] = vi.mocked(nutritionService.getWeeklySummary).mock.calls[0];
    expect([from, to]).toEqual(["2026-11-23", "2026-11-29"]);
  });
});
