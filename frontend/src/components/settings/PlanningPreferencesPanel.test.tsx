// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, renderWithProviders, stubFetch } from "../../test/appTestHarness";
import PlanningPreferencesPanel from "./PlanningPreferencesPanel";

const stored = {
  peopleEating: 2,
  minFishDinnersPerWeek: 1,
  minChickenDinnersPerWeek: 2,
  avoidTags: [],
  avoidIngredients: ["Garlic"],
  repeatAfterWeeks: 3,
  notes: null,
};

const categories = [
  {
    ingredientTagCategoryId: 1,
    name: "Protein",
    sortOrder: 1,
    showForIngredients: true,
    showForRecipes: true,
    tags: [
      { ingredientTagDefinitionId: 1, name: "Fish", sortOrder: 1, isSystemTag: true, systemKey: "Protein.Fish" },
      { ingredientTagDefinitionId: 2, name: "Lamb", sortOrder: 2, isSystemTag: true, systemKey: "Protein.Lamb" },
    ],
  },
];

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("PlanningPreferencesPanel", () => {
  it("shows the stored preferences and saves the edited form", async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.pathname === "/api/app-settings/planning-preferences") {
        return init?.method === "PUT" ? jsonResponse(JSON.parse(init.body as string)) : jsonResponse(stored);
      }

      return url.pathname === "/api/ingredient-tag-categories" ? jsonResponse(categories) : undefined;
    });

    renderWithProviders(<PlanningPreferencesPanel theme="dark" />);

    const fish = (await screen.findByLabelText("Fish dinners per week, at least")) as HTMLInputElement;
    expect(fish.value).toBe("1");
    expect(screen.getByRole("button", { name: "Remove Garlic" })).toBeTruthy();

    fireEvent.change(fish, { target: { value: "2" } });
    fireEvent.click(await screen.findByRole("button", { name: "Lamb" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Garlic" }));
    fireEvent.change(screen.getByLabelText("Notes for the assistant"), { target: { value: "Quick on weekdays" } });
    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(await screen.findByText("Planning preferences saved.")).toBeTruthy();
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(JSON.parse(put![1]!.body as string)).toEqual({
      ...stored,
      minFishDinnersPerWeek: 2,
      avoidTags: ["Lamb"],
      avoidIngredients: [],
      notes: "Quick on weekdays",
    });
  });

  it("shows the server's message when saving fails", async () => {
    stubFetch((url, init) => {
      if (url.pathname === "/api/app-settings/planning-preferences") {
        return init?.method === "PUT"
          ? new Response("The minimum fish and chicken dinners together cannot be more than 7 a week.", { status: 400 })
          : jsonResponse(stored);
      }

      return undefined;
    });

    renderWithProviders(<PlanningPreferencesPanel theme="dark" />);
    fireEvent.click(await screen.findByRole("button", { name: "Save preferences" }));

    await waitFor(() => expect(screen.getByText(/Could not save the planning preferences/)).toBeTruthy());
  });

  it("says so when the preferences cannot be loaded", async () => {
    stubFetch((url) => (url.pathname === "/api/app-settings/planning-preferences" ? new Response("", { status: 500 }) : undefined));

    renderWithProviders(<PlanningPreferencesPanel theme="dark" />);

    expect(await screen.findByText("Could not load the planning preferences.")).toBeTruthy();
  });
});
