"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  addFullscreenChangeListener,
  exitDocumentFullscreen,
  isElementFullscreen,
  isIOSOrIPadOS,
  requestElementFullscreen,
} from "@/lib/dom-fullscreen";

/**
 * Tela cheia via API do navegador quando disponível; no iOS/PWA usa overlay
 * fixo (modo imersivo) porque `requestFullscreen` em elemento em geral falha.
 */
export function useFullscreenWithMobileFallback(fsRef: RefObject<HTMLElement | null>) {
  const [isNativeFs, setIsNativeFs] = useState(false);
  const [isImmersiveFs, setIsImmersiveFs] = useState(false);
  const immersiveRef = useRef(false);

  useEffect(() => {
    immersiveRef.current = isImmersiveFs;
  }, [isImmersiveFs]);

  useEffect(() => {
    return addFullscreenChangeListener(() => {
      setIsNativeFs(isElementFullscreen(fsRef.current));
    });
  }, [fsRef]);

  useEffect(() => {
    if (!isImmersiveFs) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isImmersiveFs]);

  useEffect(() => {
    if (!isImmersiveFs) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsImmersiveFs(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isImmersiveFs]);

  const isVisualFs = isNativeFs || isImmersiveFs;

  const toggleFullscreen = useCallback(async () => {
    const el = fsRef.current;
    if (!el) return;
    if (isElementFullscreen(el)) {
      await exitDocumentFullscreen();
      return;
    }
    if (immersiveRef.current) {
      setIsImmersiveFs(false);
      return;
    }
    if (isIOSOrIPadOS()) {
      setIsImmersiveFs(true);
      return;
    }
    try {
      await requestElementFullscreen(el);
    } catch {
      setIsImmersiveFs(true);
    }
  }, [fsRef]);

  return { isNativeFs, isImmersiveFs, isVisualFs, toggleFullscreen };
}
