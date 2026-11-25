// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, renderWithProviders, stubFetch, stubMatchMedia } from "../test/appTestHarness";
import CookbookPage from "./CookbookPage";

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
  stubMatchMedia();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("CookbookPage when recipes cannot be loaded (F7)", () => {
  it("shows a short message with Retry instead of the proxy's HTML", async () => {
    let backendUp = false;
    stubFetch((url) => {
      if (url.pathname !== "/api/recipes") {
        return undefined;
      }

      return backendUp
        ? jsonResponse([])
        : new Response("<html><head><title>502 Bad Gateway</title></head></html>", {
            status: 502,
            headers: { "Content-Type": "text/html" },
          });
    });

    renderWithProviders(<CookbookPage theme="dark" />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Could not load recipes");
    expect(alert.textContent).toContain("status 502");
    expect(alert.textContent).not.toContain("Bad Gateway");

    backendUp = true;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
