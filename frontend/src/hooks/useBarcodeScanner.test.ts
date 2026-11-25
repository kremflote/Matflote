// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { IScannerControls } from "@zxing/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBarcodeScanner, type BarcodeReader } from "./useBarcodeScanner";

type FrameCallback = Parameters<BarcodeReader["decodeFromVideoDevice"]>[2];

/** A fake camera: each start resolves when the test says so; frames are pushed by hand. */
function createFakeReader() {
  const sessions: { controls: IScannerControls; callback: FrameCallback; resolve: () => void }[] = [];
  const reader: BarcodeReader = {
    decodeFromVideoDevice: (_deviceId, _video, callback) =>
      new Promise<IScannerControls>((resolve) => {
        const controls = { stop: vi.fn() } as unknown as IScannerControls;
        sessions.push({ controls, callback, resolve: () => resolve(controls) });
      }),
  };
  const frame = (session: (typeof sessions)[number], text: string) =>
    session.callback({ getText: () => text }, undefined, session.controls);

  return { reader, sessions, frame };
}

const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

beforeEach(() => {
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderScanner(reader: BarcodeReader) {
  const onDetected = vi.fn();
  const onError = vi.fn();
  const videoRef = { current: document.createElement("video") };
  const hook = renderHook(() => useBarcodeScanner({ videoRef, onDetected, onError, loadReader: async () => reader }));
  return { ...hook, onDetected, onError };
}

describe("useBarcodeScanner (F8, F11)", () => {
  it("turns the camera off when Stop is pressed while it is still starting", async () => {
    const fake = createFakeReader();
    const { result } = renderScanner(fake.reader);

    act(() => void result.current.start());
    await flush();
    expect(fake.sessions).toHaveLength(1);

    act(() => result.current.stop());
    expect(result.current.isOpen).toBe(false);

    // The camera finally answers after Stop.
    await act(async () => fake.sessions[0].resolve());
    expect(fake.sessions[0].controls.stop).toHaveBeenCalled();
  });

  it("turns the camera off when the page is left while it is still starting", async () => {
    const fake = createFakeReader();
    const { result, unmount } = renderScanner(fake.reader);

    act(() => void result.current.start());
    await flush();
    unmount();
    await act(async () => fake.sessions[0].resolve());

    expect(fake.sessions[0].controls.stop).toHaveBeenCalled();
  });

  it("handles a barcode in the very first frame, before start-up has finished", async () => {
    const fake = createFakeReader();
    const { result, onDetected } = renderScanner(fake.reader);

    act(() => void result.current.start());
    await flush();
    act(() => fake.frame(fake.sessions[0], "7038010009457"));
    expect(fake.sessions[0].controls.stop).toHaveBeenCalled();
    expect(onDetected).toHaveBeenCalledWith("7038010009457");

    await act(async () => fake.sessions[0].resolve());
    expect(result.current.isOpen).toBe(false);
  });

  it("reports a code once per session and lets the same code be scanned again", async () => {
    const fake = createFakeReader();
    const { result, onDetected } = renderScanner(fake.reader);

    act(() => void result.current.start());
    await flush();
    await act(async () => fake.sessions[0].resolve());
    act(() => {
      fake.frame(fake.sessions[0], "7038010009457");
      fake.frame(fake.sessions[0], "7038010009457");
    });
    expect(onDetected).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);

    act(() => void result.current.start());
    await flush();
    await act(async () => fake.sessions[1].resolve());
    act(() => fake.frame(fake.sessions[1], "7038010009457"));

    expect(onDetected).toHaveBeenCalledTimes(2);
  });

  it("ignores frames that are not an 8- or 13-digit EAN", async () => {
    const fake = createFakeReader();
    const { result, onDetected } = renderScanner(fake.reader);

    act(() => void result.current.start());
    await flush();
    await act(async () => fake.sessions[0].resolve());
    act(() => fake.frame(fake.sessions[0], "12345"));

    expect(onDetected).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });

  it("reports a refused camera permission", async () => {
    const { result, onError } = renderScanner({
      decodeFromVideoDevice: () => Promise.reject(new DOMException("denied", "NotAllowedError")),
    });

    await act(async () => {
      await result.current.start();
    });

    expect(onError).toHaveBeenCalledWith("permissionDenied");
    expect(result.current.isOpen).toBe(false);
  });
});
