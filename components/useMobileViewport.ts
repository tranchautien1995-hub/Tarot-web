"use client";

import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 760px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  // Safari on older iPhones still uses addListener/removeListener.
  if (media.addEventListener) {
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }
  media.addListener(onChange);
  return () => media.removeListener(onChange);
}
function getSnapshot() { return window.matchMedia(MOBILE_QUERY).matches; }
function getServerSnapshot() { return true; }

export function useMobileViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
