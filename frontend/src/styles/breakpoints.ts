/**
 * Where the layout switches between phone/tablet (fixed header, bottom navigation) and desktop (AUDIT F19). CSS uses
 * it as the desktop: and max-desktop: variants, defined by --breakpoint-desktop in index.css; this is the same width
 * for code that has to know it (breakpoints.test.ts checks that they agree).
 */
export const desktopMinWidthPx = 1100;

/** Matches below the desktop layout, like max-desktop: in CSS. */
export const belowDesktopMediaQuery = `(width < ${desktopMinWidthPx}px)`;

/** Matches the desktop layout, like desktop: in CSS. */
export const desktopMediaQuery = `(width >= ${desktopMinWidthPx}px)`;
