"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createScanId } from "../lib/verification";

let clientScanId: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (typeof window === "undefined") return null;
  clientScanId ??= createScanId();
  return clientScanId;
}

function getServerSnapshot() {
  return null;
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** Hydration-safe scan ID; regenerates on demand for "New scan". */
export function useScanId() {
  const scanId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const regenerate = useCallback(() => {
    clientScanId = createScanId();
    notify();
    return clientScanId;
  }, []);

  return { scanId, regenerate };
}
