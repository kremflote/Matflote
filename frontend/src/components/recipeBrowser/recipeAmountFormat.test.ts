import { describe, expect, it } from "vitest";
import { en } from "../../i18n/en";
import { nb } from "../../i18n/nb";
import { formatRecipeIngredientAmount } from "./recipeAmountFormat";

describe("formatRecipeIngredientAmount (F5)", () => {
  it("keeps up to two decimals instead of rounding to whole numbers", () => {
    expect(formatRecipeIngredientAmount(0.5, "Kilogram", en.enums.measurementUnits, "en-GB")).toBe("0.5 kg");
    expect(formatRecipeIngredientAmount(0.4, "Liter", en.enums.measurementUnits, "en-GB")).toBe("0.4 l");
    expect(formatRecipeIngredientAmount(1.255, "Kilogram", en.enums.measurementUnits, "en-GB")).toMatch(/^1\.2[56] kg$/);
  });

  it("scales by the portion multiplier", () => {
    expect(formatRecipeIngredientAmount(0.5, "Kilogram", en.enums.measurementUnits, "en-GB", 3)).toBe("1.5 kg");
    expect(formatRecipeIngredientAmount(250, "Gram", en.enums.measurementUnits, "en-GB", 1 / 3)).toBe("83.33 g");
  });

  it("uses the Norwegian decimal comma and no thousands separator", () => {
    expect(formatRecipeIngredientAmount(0.5, "Kilogram", nb.enums.measurementUnits, nb.locale)).toBe(
      "0,5 kg",
    );
    expect(formatRecipeIngredientAmount(1500, "Gram", nb.enums.measurementUnits, nb.locale)).toBe(
      "1500 g",
    );
  });

  it("shows only the unit when there is no amount", () => {
    expect(formatRecipeIngredientAmount(null, "Gram", en.enums.measurementUnits, "en-GB")).toBe("g");
  });
});
