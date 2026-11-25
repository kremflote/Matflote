// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { closeDetail, formatHash, navigateTo, parseHash, useHashRoute, useRouteDetail } from "./hashRoute";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("hash routes (AUDIT D7)", () => {
  it("reads pages and details from the hash", () => {
    expect(parseHash("#/planner")).toEqual({ page: "weekPlanner", detail: null });
    expect(parseHash("#/cookbook/recipe/12")).toEqual({ page: "cookbook", detail: { kind: "recipe", id: 12 } });
    expect(parseHash("#/cookbook/ingredient/7")).toEqual({ page: "cookbook", detail: { kind: "ingredient", id: 7 } });
    expect(parseHash("#/planner/recipe/3")).toEqual({ page: "weekPlanner", detail: { kind: "recipe", id: 3 } });
  });

  it("ignores what a page cannot show and hashes that name no page", () => {
    expect(parseHash("#/planner/ingredient/3")).toEqual({ page: "weekPlanner", detail: null });
    expect(parseHash("#/settings/recipe/3")).toEqual({ page: "settings", detail: null });
    expect(parseHash("#/cookbook/recipe/abc")).toEqual({ page: "cookbook", detail: null });
    expect(parseHash("#/cookbook/recipe/-1")).toEqual({ page: "cookbook", detail: null });
    expect(parseHash("")).toBeNull();
    expect(parseHash("#/elsewhere")).toBeNull();
  });

  it("writes the same hashes it reads", () => {
    for (const hash of ["#/planner", "#/cookbook/recipe/12", "#/cookbook/ingredient/7", "#/nutrition", "#/scanner", "#/settings"]) {
      const route = parseHash(hash);
      expect(route).not.toBeNull();
      expect(formatHash(route!)).toBe(hash);
    }
  });

  it("follows navigation and the back button", async () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBeNull();

    act(() => navigateTo({ page: "cookbook", detail: null }));
    expect(result.current).toEqual({ page: "cookbook", detail: null });

    act(() => navigateTo({ page: "cookbook", detail: { kind: "recipe", id: 4 } }));
    expect(window.location.hash).toBe("#/cookbook/recipe/4");

    // Closing a recipe that was opened here goes back, so Back does not open it again.
    act(() => closeDetail("cookbook"));
    await waitFor(() => expect(result.current).toEqual({ page: "cookbook", detail: null }));
  });

  it("closes a recipe opened from a link by replacing the address", () => {
    window.history.replaceState(null, "", "#/cookbook/recipe/9");
    const lengthBefore = window.history.length;
    const { result } = renderHook(() => useRouteDetail("cookbook"));
    expect(result.current.detail).toEqual({ kind: "recipe", id: 9 });

    act(() => result.current.closeDetail());
    expect(window.location.hash).toBe("#/cookbook");
    expect(window.history.length).toBe(lengthBefore);
    expect(result.current.detail).toBeNull();
  });

  it("shows a page no detail that belongs to another page", () => {
    window.history.replaceState(null, "", "#/cookbook/recipe/9");
    const { result } = renderHook(() => useRouteDetail("weekPlanner"));
    expect(result.current.detail).toBeNull();
  });
});
