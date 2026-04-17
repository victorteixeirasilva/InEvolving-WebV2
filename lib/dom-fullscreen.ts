/**
 * Fullscreen da API do DOM com prefixos legados (Safari / IE antigo).
 * Client-only — chamar só após montagem ou gesto do usuário.
 */

export function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

export function isElementFullscreen(el: Element | null): boolean {
  if (!el) return false;
  return getFullscreenElement() === el;
}

export async function requestElementFullscreen(el: HTMLElement): Promise<void> {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => void;
    msRequestFullscreen?: () => void;
  };
  if (anyEl.requestFullscreen) {
    await anyEl.requestFullscreen();
    return;
  }
  if (anyEl.webkitRequestFullscreen) {
    anyEl.webkitRequestFullscreen();
    return;
  }
  if (anyEl.msRequestFullscreen) {
    anyEl.msRequestFullscreen();
    return;
  }
  throw new Error("fullscreen_unsupported");
}

export async function exitDocumentFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => void;
    msExitFullscreen?: () => void;
  };
  if (!getFullscreenElement()) return;
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen) {
    doc.webkitExitFullscreen();
    return;
  }
  if (doc.msExitFullscreen) {
    doc.msExitFullscreen();
  }
}

export function addFullscreenChangeListener(handler: () => void): () => void {
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler as EventListener);
  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler as EventListener);
  };
}

