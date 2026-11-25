import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { AppProviders } from "../contexts";

export type FetchHandler = (url: URL, init: RequestInit | undefined) => Response | Promise<Response> | undefined;

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/**
 * Replaces fetch: each request goes to `handler` first; anything it does not answer gets an empty
 * JSON list, which is what every catalog and meal plan GET returns for an empty database.
 */
export function stubFetch(handler: FetchHandler = () => undefined) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost");
    return (await handler(url, init)) ?? jsonResponse([]);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** jsdom has no matchMedia; report a desktop-sized window without hover. */
export function stubMatchMedia() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

export function renderWithProviders(ui: ReactNode) {
  return render(<AppProviders>{ui}</AppProviders>);
}
