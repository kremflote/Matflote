import { describe, expect, it } from "vitest";
import { contrastRatio } from "../utils/colorContrast";
import { colorPalette } from "./appStyles";

// Backgrounds as they appear on screen: the light page is #FAF7F2 under a 20% #A9BDD1 wash, cards are
// #FAF7F2 at 70% over it, and the dark page is #111111 under a 3% white wash.
const lightPage = "#EAEBEB";
const lightCard = "#F4F2EE";
const darkPage = "#181818";
const darkCard = "#1F1F1F";
const darkChip = "#2F2F2F";

const textPairs: Array<[string, string, string]> = [
  ["light: olive text on ivory", colorPalette.oliveDark, colorPalette.ivory],
  ["light: olive text on the page", colorPalette.oliveDark, lightPage],
  ["light: olive text on a card", colorPalette.oliveDark, lightCard],
  ["light: olive text on champagne", colorPalette.oliveDark, colorPalette.champagne],
  ["light: dark olive text on champagne chips", "#3C4A2E", colorPalette.champagne],
  ["light: ivory on the header and olive buttons", colorPalette.ivory, colorPalette.oliveSurface],
  ["light: ivory on hovered olive buttons and title bands", colorPalette.ivory, colorPalette.oliveDark],
  ["dark: secondary text on the page", "#D4D4D4", darkPage],
  ["dark: muted text on the page", "#A3A3A3", darkPage],
  ["dark: muted text on a card", "#A3A3A3", darkCard],
  ["dark: chip text", "#FAFAFA", darkChip],
];

describe("text contrast of the theme colours (WCAG AA, 4.5:1)", () => {
  it.each(textPairs)("%s", (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the old olive out of text: it is below 4.5:1 on ivory", () => {
    expect(contrastRatio(colorPalette.olive, colorPalette.ivory)).toBeLessThan(4.5);
  });
});
