// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IIngredient } from "../../interfaces/IIngredient";
import { jsonResponse, renderWithProviders, stubFetch, stubMatchMedia } from "../../test/appTestHarness";
import BrowserDetailModal from "./BrowserDetailModal";

function ingredient(ingredientId: number, ingredientName: string): IIngredient {
  return {
    ingredientId,
    ingredientName,
    description: null,
    brandId: null,
    brand: null,
    imageUrl: null,
    thumbnailUrl: null,
    tags: [],
    nutritionPer100: null,
    nutritionSource: "None",
    nutritionSourceLabel: null,
    matvaretabellenFoodId: null,
    nutritionMatchedName: null,
    nutritionMatchConfidence: null,
    color: null,
  };
}

const duplicate = ingredient(1, "Kyllingfilet");
const keeper = ingredient(2, "Chicken breast");

beforeEach(() => {
  stubMatchMedia();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Removing an ingredient that is in use (B1)", () => {
  it.each([
    ["en", "Remove", "Remove Kyllingfilet?", "Kyllingfilet is in use", "Replace with", "Replace and remove"],
    ["nb", "Fjern", "Fjern Kyllingfilet?", "Kyllingfilet er i bruk", "Erstatt med", "Erstatt og fjern"],
  ])("lists the uses and replaces it with the chosen ingredient (%s)", async (language, remove, confirmTitle, title, replaceWith, confirm) => {
    localStorage.setItem("matflote:language", language);
    const fetchMock = stubFetch((url, init) => {
      if (url.pathname === "/api/ingredients" && (init?.method ?? "GET") === "GET") {
        return jsonResponse([duplicate, keeper]);
      }

      if (url.pathname === "/api/ingredients/1" && init?.method === "DELETE") {
        return jsonResponse(
          {
            error: "\"Kyllingfilet\" is used by 1 recipe (\"Wraps\") and 1 planned meal.",
            recipes: [{ recipeId: 5, name: "Wraps" }],
            mealPlanEntries: [{ mealPlanEntryId: 9, date: "2031-03-04", slot: "Dinner" }],
          },
          409,
        );
      }

      if (url.pathname === "/api/ingredients/1/replace-with/2") {
        return jsonResponse({ deletedIngredientId: 1, replacement: keeper, recipeLinesMoved: 1, recipeLinesMerged: 0, mealPlanItemsMoved: 1 });
      }

      return undefined;
    });
    const onClose = vi.fn();

    renderWithProviders(<BrowserDetailModal detail={{ kind: "ingredient", id: 1 }} theme="dark" onClose={onClose} />);

    fireEvent.click(await screen.findByRole("button", { name: remove }));
    const confirmDialog = await screen.findByRole("dialog", { name: confirmTitle });
    fireEvent.click(within(confirmDialog).getByRole("button", { name: remove }));

    expect(await screen.findByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByText("Wraps")).toBeTruthy();
    const confirmButton = screen.getByRole("button", { name: confirm }) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(replaceWith), { target: { value: "2" } });
    expect(confirmButton.disabled).toBe(false);
    fireEvent.click(confirmButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const replaceCall = fetchMock.mock.calls.find(([input]) => String(input).includes("/replace-with/"));
    expect(replaceCall?.[1]?.method).toBe("POST");
    expect(String(replaceCall?.[0])).toContain("/api/ingredients/1/replace-with/2");
  });
});
