import { STORAGE_KEYS } from "@/lib/constants";

export type AjustesProfile = {
  name: string;
  email: string;
  phone: string;
};

export type Amigo = {
  id: number;
  email: string;
};

const defaultProfile: AjustesProfile = {
  name: "",
  email: "",
  phone: "",
};

export function loadAjustesProfile(): AjustesProfile {
  if (typeof window === "undefined") return { ...defaultProfile };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ajustesProfile);
    if (!raw) return { ...defaultProfile };
    const p = JSON.parse(raw) as unknown;
    if (!p || typeof p !== "object") return { ...defaultProfile };
    const o = p as Record<string, unknown>;
    return {
      name: String(o.name ?? "").trim(),
      email: String(o.email ?? "").trim(),
      phone: String(o.phone ?? "").trim(),
    };
  } catch {
    return { ...defaultProfile };
  }
}

export function saveAjustesProfile(profile: AjustesProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.ajustesProfile, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function loadAmigos(): Amigo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ajustesFriends);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    const out: Amigo[] = [];
    for (const x of p) {
      if (!x || typeof x !== "object") continue;
      const o = x as Record<string, unknown>;
      const id = Number(o.id);
      const email = String(o.email ?? "").trim().toLowerCase();
      if (!Number.isFinite(id) || !email) continue;
      out.push({ id, email });
    }
    return out;
  } catch {
    return [];
  }
}

export function saveAmigos(list: Amigo[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.ajustesFriends, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** YYYY-MM-DD da próxima renovação; default ~12 meses a partir de hoje. */
export function defaultNextRenewalDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function loadRenewalDate(): string {
  if (typeof window === "undefined") return defaultNextRenewalDate();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ajustesRenewal);
    if (!raw) return defaultNextRenewalDate();
    const s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  } catch {
    /* ignore */
  }
  return defaultNextRenewalDate();
}

export function saveRenewalDate(isoDate: string) {
  if (typeof window === "undefined") return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return;
  try {
    localStorage.setItem(STORAGE_KEYS.ajustesRenewal, isoDate);
  } catch {
    /* ignore */
  }
}
