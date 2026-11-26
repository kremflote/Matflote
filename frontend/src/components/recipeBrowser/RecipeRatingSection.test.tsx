// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecipes } from "../../contexts";
import type { IRecipe } from "../../interfaces/IRecipe";
import { jsonResponse, renderWithProviders, stubFetch } from "../../test/appTestHarness";
import RecipeRatingSection from "./RecipeRatingSection";

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

/** Reads the recipe from the recipe list, as the detail view does, so a saved rating shows up. */
function RatingFromList() {
  const { recipes } = useRecipes();
  const current = recipes.find((item) => item.recipeId === recipe.recipeId);
  return current === undefined ? null : <RecipeRatingSection recipe={current} />;
}

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("RecipeRatingSection", () => {
  it("saves a star rating at once and then a note", async () => {
    const fetchMock = stubFetch((url, init) => {
      if (url.pathname === "/api/recipes") {
        return jsonResponse([recipe]);
      }

      if (url.pathname === "/api/recipes/7/rating") {
        const body = JSON.parse(init!.body as string) as { rating: number | null; note: string | null };
        return jsonResponse({ ...recipe, rating: body.rating, ratingNote: body.note });
      }

      return undefined;
    });

    renderWithProviders(<RatingFromList />);
    expect(await screen.findByText("Not rated")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "4 stars" }));
    expect(await screen.findByText("4 stars", { selector: "span" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "4 stars" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Kids loved it" } });
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));
    await waitFor(() => expect((screen.getByRole("button", { name: "Save note" }) as HTMLButtonElement).disabled).toBe(true));

    const bodies = fetchMock.mock.calls
      .filter(([input]) => String(input).includes("/rating"))
      .map(([, init]) => JSON.parse(init!.body as string) as unknown);
    expect(bodies).toEqual([{ rating: 4, note: null }, { rating: 4, note: "Kids loved it" }]);
  });

  it("clears the rating and the note together", async () => {
    const rated = { ...recipe, rating: 2, ratingNote: "Too salty" };
    const fetchMock = stubFetch((url, init) => {
      if (url.pathname === "/api/recipes") {
        return jsonResponse([rated]);
      }

      return url.pathname === "/api/recipes/7/rating"
        ? jsonResponse({ ...rated, rating: null, ratingNote: null, ...(JSON.parse(init!.body as string) as object) })
        : undefined;
    });

    renderWithProviders(<RatingFromList />);
    expect(((await screen.findByLabelText("Note")) as HTMLInputElement).value).toBe("Too salty");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(await screen.findByText("Not rated")).toBeTruthy();
    expect(screen.queryByLabelText("Note")).toBeNull();
    const put = fetchMock.mock.calls.find(([input]) => String(input).includes("/rating"));
    expect(JSON.parse(put![1]!.body as string)).toEqual({ rating: null, note: null });
  });
});
