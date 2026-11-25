import { describe, expect, it } from "vitest";
import { contrastRatio, pickReadableTextColor } from "./colorContrast";
import {
  getHeaviestIngredients,
  getMainIngredientNames,
  getRecipeColorBarBackground,
  getRecipeInitials,
  getRecipeTile,
  getRecipeTileBackground,
  type TileIngredientLine,
} from "./recipeTile";

const line = (name: string, amount: number | null, unit: TileIngredientLine["unit"], color: string | null): TileIngredientLine => ({
  amount,
  unit,
  ingredient: { ingredientName: name, color },
});

describe("recipe tile", () => {
  it("orders ingredients by weight, counting kilograms and litres in grams", () => {
    const lines = [
      line("Salt", 5, "Gram", "#FFFFFF"),
      line("Potatoes", 0.8, "Kilogram", "#E3C27A"),
      line("Milk", 300, "Milliliter", "#F4F0E6"),
      line("Stock", null, "Liter", "#996633"),
    ];

    expect(getHeaviestIngredients(lines).map((entry) => entry.ingredient.ingredientName)).toEqual([
      "Potatoes",
      "Milk",
      "Salt",
      "Stock",
    ]);
    expect(getMainIngredientNames({ name: "Mash", ingredients: lines }, 2)).toEqual(["Potatoes", "Milk"]);
  });

  it("takes up to three distinct colours from the heaviest ingredients", () => {
    const tile = getRecipeTile({
      name: "Baked salmon with potatoes",
      ingredients: [
        line("Salmon", 600, "Gram", "#f08a5d"),
        line("Potatoes", 800, "Gram", "#E3C27A"),
        line("Butter", 50, "Gram", null),
        line("Broccoli", 300, "Gram", "#4F7F3A"),
        line("Lemon", 20, "Gram", "#FFE066"),
      ],
    });

    expect(tile.colors).toEqual(["#E3C27A", "#F08A5D", "#4F7F3A"]);
    expect(tile.initials).toBe("BS");
  });

  it("falls back to a palette chosen by name when no ingredient has a colour", () => {
    const first = getRecipeTile({ name: "Soup", ingredients: [line("Water", 1, "Liter", null)] });
    const second = getRecipeTile({ name: "Soup" });

    expect(first.colors.length).toBeGreaterThan(0);
    expect(second.colors).toEqual(first.colors);
  });

  it("chooses an initials colour that reads on the tile", () => {
    for (const color of ["#FFF7EF", "#171717", "#7A8864", "#C9372C", "#F5C542"]) {
      const tile = getRecipeTile({ name: "Test dish", ingredients: [line("X", 1, "Gram", color)] });
      expect(contrastRatio(color, tile.textColor)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("builds initials from the meaningful words of a name", () => {
    expect(getRecipeInitials("Kjøttsaus med spagetti og ost")).toBe("KS");
    expect(getRecipeInitials("Pho")).toBe("P");
    expect(getRecipeInitials("ærter og bacon")).toBe("ÆB");
    expect(getRecipeInitials("  ")).toBe("?");
  });

  it("layers the colours into CSS backgrounds", () => {
    expect(getRecipeTileBackground(["#111111"])).toBe("#111111");
    expect(getRecipeTileBackground(["#111111", "#222222", "#333333"])).toMatch(/#333333.*#222222.*#111111$/);
    expect(getRecipeColorBarBackground(["#111111"])).toBe("#111111");
    expect(getRecipeColorBarBackground(["#111111", "#222222"])).toContain("#222222 50% 100%");
  });

  it("measures contrast as WCAG does", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#7A8864", "#FAF7F2")).toBeCloseTo(3.55, 2);
    expect(pickReadableTextColor("#FFFFFF")).toBe("#171717");
    expect(pickReadableTextColor("#000000")).toBe("#FAF7F2");
  });
});
