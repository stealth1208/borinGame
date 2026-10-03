"use client";

import { useEffect } from "react";

export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }
    let released = false;
    let sentinel: WakeLockSentinel | null = null;

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        sentinel = null;
      }
    };

    void request();
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) {
        void request();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release();
    };
  }, [enabled]);
}
