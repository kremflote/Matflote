// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecipes } from "../../contexts";
import type { IRecipe } from "../../interfaces/IRecipe";
import { jsonResponse, renderWithProviders, stubFetch, stubMatchMedia } from "../../test/appTestHarness";
import BrowserDetailModal from "./BrowserDetailModal";

const recipe: IRecipe = {
  recipeId: 7,
  name: "Fiskesuppe",
  imageUrl: null,
  thumbnailUrl: null,
  description: null,
  instructions: null,
  portions: 4,
  ingredients: [],
  tags: ["Dinner"],
  components: [],
  rating: null,
  ratingNote: null,
};

function RefreshButton() {
  const { refreshRecipes } = useRecipes();
  return (
    <button type="button" onClick={() => void refreshRecipes()}>
      Refresh recipes
    </button>
  );
}

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
  stubMatchMedia();
  // Every load returns a new array of new objects, as a real refresh does.
  stubFetch((url) => (url.pathname === "/api/recipes" ? jsonResponse([{ ...recipe }]) : undefined));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("BrowserDetailModal (F8)", () => {
  it("keeps the edit form open when the recipe list is refreshed", async () => {
    renderWithProviders(
      <>
        <RefreshButton />
        <BrowserDetailModal detail={{ kind: "recipe", id: 7 }} onClose={() => undefined} />
      </>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("heading", { name: "Edit Fiskesuppe" })).toBeTruthy();

    const recipeRequests = () => vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes("/api/recipes")).length;
    const before = recipeRequests();
    fireEvent.click(screen.getByRole("button", { name: "Refresh recipes" }));
    await waitFor(() => expect(recipeRequests()).toBe(before + 1));
    // Let the response reach the context.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getByRole("heading", { name: "Edit Fiskesuppe" })).toBeTruthy();
  });
});
