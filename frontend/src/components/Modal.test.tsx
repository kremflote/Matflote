// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../contexts";
import ConfirmationDialog from "./ConfirmationDialog";
import Modal from "./Modal";

beforeEach(() => {
  localStorage.setItem("matflote:language", "en");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

/** The Generate dialog as the planner builds it: a number field whose value lives in the page. */
function GenerateHarness({ onConfirm }: { onConfirm: (people: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [people, setPeople] = useState(2);

  return (
    <LanguageProvider>
      <button type="button" onClick={() => setIsOpen(true)}>
        Generate
      </button>
      {isOpen && (
        <ConfirmationDialog
          body={
            <label>
              People
              <input
                type="number"
                value={people}
                onChange={(event) => setPeople(Number(event.currentTarget.value))}
              />
            </label>
          }
          confirmLabel="Go"
          theme="dark"
          title="Generate week"
          tone="default"
          onCancel={() => setIsOpen(false)}
          onConfirm={() => {
            onConfirm(people);
            setIsOpen(false);
          }}
        />
      )}
    </LanguageProvider>
  );
}

function TwoDialogs({ onOuterClose, onInnerClose }: { onOuterClose: () => void; onInnerClose: () => void }) {
  const [isInnerOpen, setIsInnerOpen] = useState(false);

  return (
    <Modal backdropClassName="" closeButtonClassName="" closeLabel="Close outer" panelClassName="" title="Outer" onClose={onOuterClose}>
      <button type="button" onClick={() => setIsInnerOpen(true)}>
        Open inner
      </button>
      {isInnerOpen && (
        <Modal
          backdropClassName=""
          closeButtonClassName=""
          closeLabel="Close inner"
          panelClassName=""
          title="Inner"
          onClose={() => {
            onInnerClose();
            setIsInnerOpen(false);
          }}
        >
          <button type="button">Inside inner</button>
        </Modal>
      )}
    </Modal>
  );
}

describe("Modal", () => {
  it("keeps focus in the field while typing, so Enter does not cancel the Generate dialog (F2)", () => {
    const onConfirm = vi.fn();
    render(<GenerateHarness onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    const input = screen.getByRole("spinbutton");
    act(() => input.focus());

    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.change(input, { target: { value: "5" } });

    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onConfirm).toHaveBeenCalledWith(5);
  });

  it("focuses the close button once when it opens and returns focus to the opener when it closes", () => {
    render(<GenerateHarness onConfirm={() => undefined} />);
    const opener = screen.getByRole("button", { name: "Generate" });
    act(() => opener.focus());

    fireEvent.click(opener);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));

    fireEvent.keyDown(document.activeElement ?? document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("closes only the top-most dialog on Escape", () => {
    const onOuterClose = vi.fn();
    const onInnerClose = vi.fn();
    render(<TwoDialogs onInnerClose={onInnerClose} onOuterClose={onOuterClose} />);

    const openInner = screen.getByRole("button", { name: "Open inner" });
    act(() => openInner.focus());
    fireEvent.click(openInner);
    expect(screen.getAllByRole("dialog")).toHaveLength(2);

    fireEvent.keyDown(document.activeElement ?? document, { key: "Escape" });
    expect(onInnerClose).toHaveBeenCalledTimes(1);
    expect(onOuterClose).not.toHaveBeenCalled();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(document.activeElement).toBe(openInner);

    fireEvent.keyDown(document.activeElement ?? document, { key: "Escape" });
    expect(onOuterClose).toHaveBeenCalledTimes(1);
  });

  it("keeps Tab inside the dialog", () => {
    render(
      <>
        <button type="button">Outside</button>
        <Modal backdropClassName="" closeButtonClassName="" closeLabel="Close" panelClassName="" title="Dialog" onClose={() => undefined}>
          <button type="button">First action</button>
          <button type="button">Last action</button>
        </Modal>
      </>,
    );

    const close = screen.getByRole("button", { name: "Close" });
    const last = screen.getByRole("button", { name: "Last action" });
    expect(document.activeElement).toBe(close);

    act(() => last.focus());
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(close);

    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("locks page scrolling while any dialog is open", () => {
    const { rerender } = render(
      <Modal backdropClassName="" panelClassName="" onClose={() => undefined}>
        <p>Body</p>
      </Modal>,
    );

    expect(document.documentElement.style.overflow).toBe("hidden");

    rerender(<p>Closed</p>);
    expect(document.documentElement.style.overflow).toBe("");
  });
});
