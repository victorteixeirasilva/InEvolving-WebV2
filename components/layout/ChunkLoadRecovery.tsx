"use client";

import { useEffect } from "react";

const BUILD = process.env.NEXT_PUBLIC_APP_BUILD_TIME ?? "";

function isChunkLoadError(reason: unknown): boolean {
  const msg =
    typeof reason === "object" && reason !== null && "message" in reason
      ? String((reason as { message?: unknown }).message)
      : String(reason);
  return (
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module")
  );
}

/**
 * Um deploy novo remove chunks antigos; quem ficou com bundle em cache tenta carregar 404.
 * Um reload completo puxa HTML novo e alinha os hashes.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const tryReload = () => {
      if (typeof window === "undefined" || !BUILD) return;
      const key = `inevolving-chunk-reload:${BUILD}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        return;
      }
      window.location.reload();
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      if (isChunkLoadError(e.reason)) tryReload();
    };

    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  return null;
}
