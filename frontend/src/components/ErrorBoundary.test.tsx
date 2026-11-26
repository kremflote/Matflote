// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";

function Broken(): never {
  throw new Error("Cannot read properties of undefined");
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ErrorBoundary (F7)", () => {
  it("shows a message and a Reload button instead of a blank page", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    document.documentElement.lang = "nb";

    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert").textContent).toContain("Noe gikk galt");
    expect(screen.getByRole("button", { name: "Last inn på nytt" })).toBeTruthy();
  });

  it("renders its children when nothing fails", () => {
    render(
      <ErrorBoundary>
        <p>Planner</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Planner")).toBeTruthy();
  });
});
