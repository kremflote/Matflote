import type { MeasurementUnit } from "../interfaces/IIngredient";
import { parseHexColor, pickReadableTextColor } from "./colorContrast";

/** The parts of a recipe line the imageless tile needs; the recipe list carries all of them. */
export type TileIngredientLine = {
  amount: number | null;
  unit: MeasurementUnit;
  ingredient: { ingredientName: string; color: string | null };
};

export type TileRecipe = {
  name: string;
  ingredients?: readonly TileIngredientLine[];
};

export type RecipeTile = {
  /** One to three colours, heaviest ingredient first. */
  colors: string[];
  initials: string;
  /** Text colour that reads on the first colour. */
  textColor: string;
};

// Used when no ingredient has a colour: muted kitchen tones picked by the recipe's name, so a recipe
// always gets the same tile.
const fallbackPalettes = [
  ["#C98B5B", "#E8C99B", "#6F7F4F"],
  ["#8C5A3C", "#D9A066", "#F1E3C6"],
  ["#5E7A6B", "#C9D3B5", "#E2A65A"],
  ["#B5553C", "#F0C987", "#7A8864"],
  ["#6B5B7A", "#D7C2A4", "#A9BDD1"],
  ["#A26E2C", "#EAD7B0", "#556145"],
];

function toBaseAmount(amount: number | null, unit: MeasurementUnit) {
  if (amount === null || !Number.isFinite(amount)) {
    return 0;
  }

  return unit === "Kilogram" || unit === "Liter" ? amount * 1000 : amount;
}

/** The recipe's lines from heaviest to lightest, grams and millilitres counted alike. */
export function getHeaviestIngredients<TLine extends TileIngredientLine>(lines: readonly TLine[]) {
  return lines
    .map((line, index) => ({ line, index, weight: toBaseAmount(line.amount, line.unit) }))
    .sort((first, second) => second.weight - first.weight || first.index - second.index)
    .map((entry) => entry.line);
}

/** Names of the two or three heaviest ingredients, for a text-first card. */
export function getMainIngredientNames(recipe: TileRecipe, count = 3) {
  return getHeaviestIngredients(recipe.ingredients ?? [])
    .slice(0, count)
    .map((line) => line.ingredient.ingredientName);
}

export function getRecipeInitials(name: string) {
  const words = name.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word));
  // "Baked salmon with potatoes" reads as BS; skip short linking words when there is a choice.
  const meaningful = words.filter((word) => word.length > 3);
  const source = meaningful.length >= 2 ? meaningful : words;
  const initials = source
    .slice(0, 2)
    .map((word) => Array.from(word.replace(/^[^\p{L}\p{N}]+/u, ""))[0]?.toLocaleUpperCase() ?? "")
    .join("");

  return initials || "?";
}

function hashName(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash;
}

export function getRecipeTile(recipe: TileRecipe): RecipeTile {
  const colors: string[] = [];

  for (const line of getHeaviestIngredients(recipe.ingredients ?? [])) {
    const color = line.ingredient.color;
    if (color === null || parseHexColor(color) === null) {
      continue;
    }

    const normalized = color.toUpperCase();
    if (!colors.includes(normalized)) {
      colors.push(normalized);
    }

    if (colors.length === 3) {
      break;
    }
  }

  const palette = colors.length > 0 ? colors : fallbackPalettes[hashName(recipe.name) % fallbackPalettes.length];

  return {
    colors: palette,
    initials: getRecipeInitials(recipe.name),
    textColor: pickReadableTextColor(palette[0]),
  };
}

/**
 * The tile's background: the heaviest ingredient's colour as the plate, the next two as overlapping
 * circles in the lower right corner.
 */
export function getRecipeTileBackground(colors: readonly string[]) {
  const [base, second, third] = colors;
  const layers: string[] = [];

  if (third !== undefined) {
    layers.push(`radial-gradient(circle at 58% 108%, ${third} 0 30%, transparent 30.5%)`);
  }

  if (second !== undefined) {
    layers.push(`radial-gradient(circle at 104% 74%, ${second} 0 38%, transparent 38.5%)`);
  }

  layers.push(base);
  return layers.join(", ");
}

/** A vertical bar of the colours, for a card that has no room for a tile. */
export function getRecipeColorBarBackground(colors: readonly string[]) {
  if (colors.length === 1) {
    return colors[0];
  }

  const step = 100 / colors.length;
  return `linear-gradient(to bottom, ${colors
    .map((color, index) => `${color} ${index * step}% ${(index + 1) * step}%`)
    .join(", ")})`;
}
