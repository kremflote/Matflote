/** WCAG 2 relative luminance and contrast ratio for #RGB or #RRGGBB colours. */

export function parseHexColor(value: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (match === null) {
    return null;
  }

  const hex = match[1].length === 3
    ? match[1].split("").map((digit) => digit + digit).join("")
    : match[1];

  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number];
}

export function relativeLuminance(value: string) {
  const rgb = parseHexColor(value);
  if (rgb === null) {
    return null;
  }

  const [red, green, blue] = rgb.map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  if (firstLuminance === null || secondLuminance === null) {
    return null;
  }

  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Whichever of the two text colours reads better on the background. */
export function pickReadableTextColor(background: string, dark = "#171717", light = "#FAF7F2") {
  const onDark = contrastRatio(background, light) ?? 0;
  const onLight = contrastRatio(background, dark) ?? 0;
  return onLight >= onDark ? dark : light;
}
