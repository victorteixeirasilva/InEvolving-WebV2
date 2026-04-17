/**
 * Screen Wake Lock — mantém a tela ligada (Chrome/Android, desktop Chromium).
 * iOS Safari em geral não expõe a API; em caso de falha, falha silenciosa.
 */

let sentinel: WakeLockSentinel | null = null;

export function isScreenWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator && !!navigator.wakeLock;
}

export async function requestScreenWakeLock(): Promise<boolean> {
  if (!isScreenWakeLockSupported()) return false;
  try {
    await releaseScreenWakeLock();
    sentinel = await navigator.wakeLock!.request("screen");
    sentinel.addEventListener("release", () => {
      sentinel = null;
    });
    return true;
  } catch {
    return false;
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (!sentinel) return;
  try {
    await sentinel.release();
  } catch {
    /* ignore */
  }
  sentinel = null;
}
