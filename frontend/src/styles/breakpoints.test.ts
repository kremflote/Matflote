import { describe, expect, it } from "vitest";
import css from "../index.css?raw";
import { desktopMinWidthPx } from "./breakpoints";

describe("the desktop breakpoint", () => {
  it("is the same width in code as in index.css", () => {
    expect(css).toContain(`--breakpoint-desktop: ${desktopMinWidthPx}px;`);
  });
});
