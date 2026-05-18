import { STORAGE_KEYS } from "@/lib/constants";

const SHARE_FLAG = "1";

export function applyFinanceShareTokenFromUrl(token: string): void {
  if (typeof window === "undefined") return;
  const jwt = token.trim();
  if (!jwt) return;
  try {
    localStorage.setItem(STORAGE_KEYS.token, jwt);
    sessionStorage.setItem(STORAGE_KEYS.financeShareEntry, SHARE_FLAG);
  } catch {
    /* ignore */
  }
}

export function isFinanceShareSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEYS.financeShareEntry) === SHARE_FLAG;
  } catch {
    return false;
  }
}

export function clearFinanceShareSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.financeShareEntry);
  } catch {
    /* ignore */
  }
}

export function getStoredJwt(): string {
  if (typeof window === "undefined") return "";
  try {
    return String(localStorage.getItem(STORAGE_KEYS.token) ?? "").trim();
  } catch {
    return "";
  }
}
