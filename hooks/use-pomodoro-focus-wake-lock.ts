"use client";

import { useEffect } from "react";
import { releaseScreenWakeLock, requestScreenWakeLock } from "@/lib/screen-wake-lock";

/** Viewport estreito ou ponteiro grosso (touch) — alinhado ao uso em celular/PWA. */
function isMobileishViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * Durante foco com timer rodando, em dispositivos “mobile/touch”, pede wake lock
 * para reduzir chance de a tela apagar (quando o navegador suporta).
 */
export function usePomodoroFocusWakeLock(isActive: boolean, mode: "focus" | "rest") {
  useEffect(() => {
    if (!isActive || mode !== "focus" || !isMobileishViewport()) {
      void releaseScreenWakeLock();
      return;
    }

    const tryAcquire = () => {
      if (document.visibilityState === "visible") {
        void requestScreenWakeLock();
      }
    };

    void tryAcquire();

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void releaseScreenWakeLock();
      } else {
        void tryAcquire();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void releaseScreenWakeLock();
    };
  }, [isActive, mode]);
}
