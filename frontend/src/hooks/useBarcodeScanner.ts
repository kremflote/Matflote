import type { IScannerControls } from "@zxing/browser";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type BarcodeScannerError = "permissionDenied" | "unsupported";

/** The part of @zxing/browser's reader the scanner uses; tests pass a fake. */
export type BarcodeReader = {
  decodeFromVideoDevice: (
    deviceId: string | undefined,
    video: HTMLVideoElement,
    callback: (result: { getText: () => string } | undefined, error: unknown, controls: IScannerControls) => void,
  ) => Promise<IScannerControls>;
};

type UseBarcodeScannerOptions = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Called once per camera session with an 8- or 13-digit EAN; the camera is already stopped. */
  onDetected: (ean: string) => void;
  onError: (error: BarcodeScannerError) => void;
  loadReader?: () => Promise<BarcodeReader>;
};

async function loadZxingReader(): Promise<BarcodeReader> {
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  return new BrowserMultiFormatReader();
}

const waitForFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

/**
 * The camera's lifecycle for EAN scanning. `start` can be cancelled at any point of its start-up
 * (Stop, leaving the page, starting again): a session that is no longer current stops its own
 * camera as soon as it gets hold of it, so the camera cannot stay on.
 */
export function useBarcodeScanner({ videoRef, onDetected, onError, loadReader = loadZxingReader }: UseBarcodeScannerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const sessionRef = useRef(0);
  const controlsRef = useRef<IScannerControls | null>(null);
  const callbacksRef = useRef({ onDetected, onError, loadReader });

  useEffect(() => {
    callbacksRef.current = { onDetected, onError, loadReader };
  });

  const stop = useCallback(() => {
    sessionRef.current += 1;
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsOpen(false);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      callbacksRef.current.onError("unsupported");
      return;
    }

    controlsRef.current?.stop();
    controlsRef.current = null;
    const session = ++sessionRef.current;
    const isCurrent = () => session === sessionRef.current;
    // Within one session a code is reported once, however many frames show it. A new session
    // starts afresh, so the same barcode can be scanned again.
    let detected = false;
    setIsOpen(true);

    try {
      // The video element is rendered once the camera is open.
      await waitForFrame();
      if (!isCurrent()) {
        return;
      }

      const video = videoRef.current;
      if (video === null) {
        throw new Error("Scanner video element was not ready.");
      }

      const reader = await callbacksRef.current.loadReader();
      if (!isCurrent()) {
        return;
      }

      const controls = await reader.decodeFromVideoDevice(undefined, video, (result, _error, frameControls) => {
        const ean = result?.getText().replace(/\D/g, "");
        if (detected || ean === undefined || !/^(\d{8}|\d{13})$/.test(ean)) {
          return;
        }

        detected = true;
        // The callback's own controls: the outer ones are not assigned yet on the first frame.
        frameControls.stop();
        if (isCurrent()) {
          controlsRef.current = null;
          sessionRef.current += 1;
          setIsOpen(false);
          callbacksRef.current.onDetected(ean);
        }
      });

      if (!isCurrent() || detected) {
        controls.stop();
        return;
      }

      controlsRef.current = controls;
    } catch (caughtError) {
      if (!isCurrent()) {
        return;
      }

      const errorName = caughtError instanceof DOMException ? caughtError.name : "";
      stop();
      callbacksRef.current.onError(
        errorName === "NotAllowedError" || errorName === "PermissionDeniedError" ? "permissionDenied" : "unsupported",
      );
    }
  }, [stop, videoRef]);

  // Leaving the page turns the camera off, also while it is still starting.
  useEffect(() => stop, [stop]);

  return { isOpen, start, stop };
}
